import {
  CARD_THEME_OPTIONS,
  DEFAULT_STOP_OPTIONS,
  type CardTheme,
  type ClientStopGameState,
  type RoomState,
  type StopGameState,
  type StopOptions,
  type StopRoundPlayerResult,
  type StopValidationItem,
} from "@entre-extremos/shared";
import { normalizeCardThemes } from "./cards";
import { getWinners } from "./game";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const CATEGORY_COUNT = 9;

export const DEFAULT_STOP_OPTIONS_SERVER = DEFAULT_STOP_OPTIONS;

function getStopState(room: RoomState): StopGameState | undefined {
  return room.gameState?.kind === "stop" ? room.gameState : undefined;
}

function playerName(room: RoomState, playerId: string): string {
  return room.players.find((player) => player.id === playerId)?.name ?? "Jogador";
}

function connectedPlayers(room: RoomState) {
  return room.players.filter((player) => player.connected);
}

export function normalizeStopOptions(options?: StopOptions): StopOptions {
  return {
    roundCount: Math.max(1, Math.min(20, options?.roundCount ?? DEFAULT_STOP_OPTIONS.roundCount)),
    fillTimeMs: Math.max(30000, Math.min(300000, options?.fillTimeMs ?? DEFAULT_STOP_OPTIONS.fillTimeMs)),
    validationTimeMs: Math.max(
      30000,
      Math.min(180000, options?.validationTimeMs ?? DEFAULT_STOP_OPTIONS.validationTimeMs)
    ),
    validAnswerPoints: Math.max(1, options?.validAnswerPoints ?? DEFAULT_STOP_OPTIONS.validAnswerPoints),
    uniqueAnswerBonus: Math.max(0, options?.uniqueAnswerBonus ?? DEFAULT_STOP_OPTIONS.uniqueAnswerBonus),
  };
}

export function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function startsWithLetter(answer: string, letter: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return false;
  return trimmed[0].toLocaleUpperCase("pt-BR") === letter.toLocaleUpperCase("pt-BR");
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function resolveCategoryPool(room: RoomState): CardTheme[] {
  const normalized = normalizeCardThemes(room.cardThemes);
  const allThemes = CARD_THEME_OPTIONS.map((theme) => theme.id);
  const pool = normalized.length >= CATEGORY_COUNT ? normalized : allThemes;
  return [...new Set(pool)];
}

export function pickLetter(usedLetters: string[]): string {
  const available = LETTERS.filter((letter) => !usedLetters.includes(letter));
  const source = available.length > 0 ? available : LETTERS;
  return source[Math.floor(Math.random() * source.length)];
}

export function pickCategories(pool: CardTheme[], count = CATEGORY_COUNT): CardTheme[] {
  const uniquePool = [...new Set(pool)];
  return shuffle(uniquePool).slice(0, Math.min(count, uniquePool.length));
}

function categoryLabels(categories: CardTheme[]): Record<CardTheme, string> {
  const labels = {} as Record<CardTheme, string>;
  for (const categoryId of categories) {
    labels[categoryId] =
      CARD_THEME_OPTIONS.find((theme) => theme.id === categoryId)?.label ?? categoryId;
  }
  return labels;
}

function ensurePlayerAnswers(state: StopGameState, playerId: string): Record<string, string> {
  if (!state.answers[playerId]) {
    state.answers[playerId] = {};
  }
  return state.answers[playerId];
}

function hasAllCategoriesFilled(
  answers: Record<string, string>,
  categories: CardTheme[],
  letter: string
): boolean {
  return categories.every((categoryId) => {
    const answer = answers[categoryId] ?? "";
    return answer.trim().length > 0 && startsWithLetter(answer, letter);
  });
}

function validationPairs(state: StopGameState, room: RoomState) {
  const pairs: Array<{ categoryId: CardTheme; answerOwnerId: string; answer: string }> = [];
  for (const categoryId of state.categories) {
    for (const player of connectedPlayers(room)) {
      const answer = (state.answers[player.id]?.[categoryId] ?? "").trim();
      if (!answer) continue;
      pairs.push({ categoryId, answerOwnerId: player.id, answer });
    }
  }
  return pairs;
}

function countVotes(
  state: StopGameState,
  categoryId: CardTheme,
  answerOwnerId: string
): { valid: number; invalid: number } {
  const votes = state.votes[categoryId]?.[answerOwnerId] ?? {};
  let valid = 0;
  let invalid = 0;
  for (const value of Object.values(votes)) {
    if (value) valid += 1;
    else invalid += 1;
  }
  return { valid, invalid };
}

function allVotesComplete(state: StopGameState, room: RoomState): boolean {
  const connected = connectedPlayers(room);
  for (const pair of validationPairs(state, room)) {
    const eligibleVoters = connected.filter((player) => player.id !== pair.answerOwnerId);
    const votes = state.votes[pair.categoryId]?.[pair.answerOwnerId] ?? {};
    for (const voter of eligibleVoters) {
      if (votes[voter.id] === undefined) return false;
    }
  }
  return validationPairs(state, room).length > 0;
}

function scoreRound(room: RoomState, state: StopGameState): StopRoundPlayerResult[] {
  const options = normalizeStopOptions(room.stopOptions);
  const results: StopRoundPlayerResult[] = [];
  const normalizedByCategory = new Map<CardTheme, Map<string, string[]>>();

  for (const categoryId of state.categories) {
    const bucket = new Map<string, string[]>();
    for (const player of connectedPlayers(room)) {
      const raw = (state.answers[player.id]?.[categoryId] ?? "").trim();
      if (!raw) continue;
      const key = normalizeAnswer(raw);
      const list = bucket.get(key) ?? [];
      list.push(player.id);
      bucket.set(key, list);
    }
    normalizedByCategory.set(categoryId, bucket);
  }

  for (const player of connectedPlayers(room)) {
    const categories = state.categories.map((categoryId) => {
      const raw = (state.answers[player.id]?.[categoryId] ?? "").trim();
      const { valid, invalid } = countVotes(state, categoryId, player.id);
      const majorityValid = raw.length > 0 && valid > invalid;
      const normalized = normalizeAnswer(raw);
      const sameAnswerPlayers =
        normalized.length > 0
          ? (normalizedByCategory.get(categoryId)?.get(normalized) ?? [])
          : [];
      const unique = majorityValid && sameAnswerPlayers.length === 1;
      let points = 0;
      if (majorityValid) {
        points += options.validAnswerPoints;
        if (unique) points += options.uniqueAnswerBonus;
      }
      return {
        categoryId,
        answer: raw,
        valid: majorityValid,
        unique,
        points,
      };
    });
    const totalPoints = categories.reduce((sum, item) => sum + item.points, 0);
    results.push({ playerId: player.id, totalPoints, categories });
  }

  return results;
}

function applyRoundScores(room: RoomState, results: StopRoundPlayerResult[]): void {
  for (const result of results) {
    room.score[result.playerId] = (room.score[result.playerId] ?? 0) + result.totalPoints;
  }
}

function checkGameOver(room: RoomState, state: StopGameState): boolean {
  const winners = getWinners(room.score, room.winningScore);
  if (winners.length > 0) {
    state.isGameOver = true;
    state.winnerIds = winners;
    state.phase = "game-over";
    room.status = "finished";
    state.lastAction = "Alguém venceu o Stop!";
    return true;
  }
  return false;
}

export function startRound(room: RoomState, previous?: StopGameState): { error?: string } {
  const options = normalizeStopOptions(room.stopOptions);
  const pool = resolveCategoryPool(room);
  if (pool.length < CATEGORY_COUNT) {
    return { error: "São necessários pelo menos 9 temas para jogar Stop." };
  }

  const roundNumber = (previous?.roundNumber ?? 0) + 1;
  if (roundNumber > options.roundCount && previous) {
    return { error: "Todas as rodadas foram concluídas." };
  }

  const letter = pickLetter(previous?.usedLetters ?? []);
  const categories = pickCategories(pool);
  const state: StopGameState = {
    kind: "stop",
    roundNumber,
    totalRounds: options.roundCount,
    letter,
    categories,
    phase: "filling",
    answers: {},
    lockedPlayers: [],
    votes: {},
    usedLetters: [...(previous?.usedLetters ?? []), letter],
    lastAction: `Rodada ${roundNumber}: letra ${letter}.`,
  };

  room.status = "playing";
  room.gameState = state;
  return {};
}

export function startStopGame(room: RoomState): { error?: string } {
  const connected = connectedPlayers(room);
  if (connected.length < 2) return { error: "São necessários pelo menos 2 jogadores." };

  room.stopOptions = normalizeStopOptions(room.stopOptions);
  connected.forEach((player) => {
    room.score[player.id] = room.score[player.id] ?? 0;
  });

  return startRound(room);
}

export function beginValidation(room: RoomState, state: StopGameState, reason: string): void {
  state.phase = "validation";
  state.stoppedByPlayerId = state.stoppedByPlayerId;
  state.votes = {};
  state.turnDeadlineAt = undefined;
  state.lastAction = reason;
}

export function submitStopAnswers(
  room: RoomState,
  playerId: string,
  answers: Record<string, string>
): { error?: string } {
  const state = getStopState(room);
  if (!state) return { error: "Stop não iniciado." };
  if (state.phase !== "filling") return { error: "Não é hora de preencher respostas." };

  const playerAnswers = ensurePlayerAnswers(state, playerId);
  for (const categoryId of state.categories) {
    if (answers[categoryId] !== undefined) {
      playerAnswers[categoryId] = answers[categoryId].slice(0, 80);
    }
  }

  if (!state.lockedPlayers.includes(playerId)) {
    state.lockedPlayers.push(playerId);
  }

  state.lastAction = `${playerName(room, playerId)} atualizou as respostas.`;
  return {};
}

export function callStop(room: RoomState, playerId: string): { error?: string } {
  const state = getStopState(room);
  if (!state) return { error: "Stop não iniciado." };
  if (state.phase !== "filling") return { error: "A rodada já foi encerrada." };

  const playerAnswers = ensurePlayerAnswers(state, playerId);
  if (!hasAllCategoriesFilled(playerAnswers, state.categories, state.letter)) {
    return { error: "Preencha todas as 9 categorias antes de apertar STOP." };
  }

  if (!state.lockedPlayers.includes(playerId)) {
    state.lockedPlayers.push(playerId);
  }

  state.stoppedByPlayerId = playerId;
  beginValidation(room, state, `${playerName(room, playerId)} gritou STOP!`);
  return {};
}

export function voteStopAnswer(
  room: RoomState,
  voterId: string,
  categoryId: CardTheme,
  answerOwnerId: string,
  valid: boolean
): { error?: string; completed?: boolean } {
  const state = getStopState(room);
  if (!state) return { error: "Stop não iniciado." };
  if (state.phase !== "validation") return { error: "Não é hora de validar." };
  if (!state.categories.includes(categoryId)) return { error: "Categoria inválida." };
  if (voterId === answerOwnerId) return { error: "Você não pode votar na própria resposta." };

  const answer = (state.answers[answerOwnerId]?.[categoryId] ?? "").trim();
  if (!answer) return { error: "Resposta inexistente." };

  if (!state.votes[categoryId]) state.votes[categoryId] = {};
  if (!state.votes[categoryId][answerOwnerId]) state.votes[categoryId][answerOwnerId] = {};
  state.votes[categoryId][answerOwnerId][voterId] = valid;

  state.lastAction = `${playerName(room, voterId)} votou em uma resposta.`;

  if (allVotesComplete(state, room)) {
    finishValidation(room, state);
    return { completed: true };
  }

  return {};
}

function finishValidation(room: RoomState, state: StopGameState): void {
  const results = scoreRound(room, state);
  state.roundResults = results;
  applyRoundScores(room, results);

  if (checkGameOver(room, state)) return;

  state.phase = "round-ended";
  state.turnDeadlineAt = undefined;
  const topScorer = [...results].sort((a, b) => b.totalPoints - a.totalPoints)[0];
  state.lastAction = topScorer
    ? `Rodada encerrada. ${playerName(room, topScorer.playerId)} marcou ${topScorer.totalPoints} pts nesta rodada.`
    : "Rodada encerrada.";
}

export function penalizeStopPhaseTimeout(room: RoomState): boolean {
  const state = getStopState(room);
  if (!state || state.isGameOver || room.status !== "playing") return false;

  if (state.phase === "filling") {
    beginValidation(room, state, "O tempo acabou!");
    return true;
  }

  if (state.phase === "validation") {
    finishValidation(room, state);
    return true;
  }

  return false;
}

export function nextStopRound(room: RoomState, playerId: string): { error?: string } {
  const state = getStopState(room);
  if (!state) return { error: "Stop não iniciado." };
  if (state.isGameOver) return { error: "O jogo já terminou." };
  if (state.phase !== "round-ended") return { error: "A validação da rodada ainda não terminou." };

  const host = room.players.find((player) => player.id === playerId);
  if (!host?.isHost) return { error: "Apenas o host pode avançar a rodada." };

  if (state.roundNumber >= state.totalRounds) {
    const winners = getWinners(room.score, room.winningScore);
    state.isGameOver = true;
    state.winnerIds = winners.length > 0 ? winners : undefined;
    state.phase = "game-over";
    room.status = "finished";
    state.lastAction = "Todas as rodadas foram jogadas.";
    return {};
  }

  return startRound(room, state);
}

export function getPhaseDeadlineMs(room: RoomState, state: StopGameState): number | undefined {
  const options = normalizeStopOptions(room.stopOptions);
  if (state.phase === "filling") return options.fillTimeMs;
  if (state.phase === "validation") return options.validationTimeMs;
  return undefined;
}

export function toClientStopState(room: RoomState, playerId: string): ClientStopGameState | undefined {
  const state = getStopState(room);
  if (!state) return undefined;

  const labels = categoryLabels(state.categories);
  const myAnswers = { ...(state.answers[playerId] ?? {}) };
  const allAnswers: Record<string, Record<string, string>> = {};
  const playerNames: Record<string, string> = {};

  for (const player of room.players) {
    playerNames[player.id] = player.name;
    if (state.phase === "validation" || state.phase === "round-ended" || state.phase === "game-over") {
      allAnswers[player.id] = { ...(state.answers[player.id] ?? {}) };
    }
  }

  const validationItems: StopValidationItem[] = [];
  if (state.phase === "validation") {
    for (const pair of validationPairs(state, room)) {
      const { valid, invalid } = countVotes(state, pair.categoryId, pair.answerOwnerId);
      const eligibleVoters = connectedPlayers(room).filter(
        (player) => player.id !== pair.answerOwnerId
      ).length;
      const myVote = state.votes[pair.categoryId]?.[pair.answerOwnerId]?.[playerId];
      validationItems.push({
        categoryId: pair.categoryId,
        answerOwnerId: pair.answerOwnerId,
        answerOwnerName: playerName(room, pair.answerOwnerId),
        answer: pair.answer,
        validVotes: valid,
        invalidVotes: invalid,
        totalVoters: eligibleVoters,
        majorityValid: valid + invalid > 0 ? valid > invalid : undefined,
        myVote,
      });
    }
  }

  let pendingVotes = 0;
  let totalVotesRequired = 0;
  if (state.phase === "validation") {
    for (const pair of validationPairs(state, room)) {
      const eligible = connectedPlayers(room).filter((player) => player.id !== pair.answerOwnerId);
      totalVotesRequired += eligible.length;
      const votes = state.votes[pair.categoryId]?.[pair.answerOwnerId] ?? {};
      for (const voter of eligible) {
        if (votes[voter.id] === undefined) pendingVotes += 1;
      }
    }
  }

  const filledCount = state.categories.filter((categoryId) => {
    const answer = myAnswers[categoryId] ?? "";
    return answer.trim().length > 0 && startsWithLetter(answer, state.letter);
  }).length;

  const canStop =
    state.phase === "filling" && filledCount === state.categories.length && state.categories.length > 0;

  return {
    kind: "stop",
    roundNumber: state.roundNumber,
    totalRounds: state.totalRounds,
    letter: state.letter,
    categories: state.categories,
    categoryLabels: labels,
    phase: state.phase,
    myAnswers,
    allAnswers,
    playerNames,
    lockedPlayers: state.lockedPlayers,
    stoppedByPlayerId: state.stoppedByPlayerId,
    stoppedByName: state.stoppedByPlayerId
      ? playerName(room, state.stoppedByPlayerId)
      : undefined,
    validationItems,
    roundResults: state.roundResults,
    lastAction: state.lastAction,
    winnerIds: state.winnerIds,
    isGameOver: state.isGameOver,
    turnDeadlineAt: state.turnDeadlineAt,
    canSubmit: state.phase === "filling",
    canStop,
    filledCount,
    pendingVotes,
    totalVotesRequired,
  };
}
