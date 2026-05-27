import { v4 as uuidv4 } from "uuid";
import type {
  CardSource,
  CardTheme,
  CardColor,
  ChatMessage,
  ClientRoomState,
  ClientRoundState,
  FourColorsOptions,
  GameMode,
  PokerOptions,
  Player,
  RoomState,
  RoundState,
  SelectedGame,
  Team,
} from "@entre-extremos/shared";
import { normalizeCardThemes, pickRandomCard, randomTargetPosition } from "./cards";
import {
  callOne,
  challengeOne,
  chooseColor,
  chooseHandSwapTarget,
  drawCard,
  passTurn,
  penalizeMissedOne,
  penalizeTurnTimeout,
  playCard,
  playerNeedsOneCall,
  startFourColorsGame,
  toClientFourColorsState,
} from "./fourColors";
import {
  allInPoker,
  betPoker,
  callPoker,
  checkPoker,
  DEFAULT_POKER_OPTIONS,
  foldPoker,
  nextPokerHand,
  penalizePokerTurnTimeout,
  raisePoker,
  startPokerGame,
  toClientPokerState,
} from "./poker";
import {
  calculateRoundResult,
  getTeamWinners,
  getWinners,
} from "./game";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_COUPLE_PLAYERS = 2;
const MAX_TEAM_PLAYERS = 8;
const MAX_POKER_PLAYERS = 8;
const MAX_CHAT_MESSAGES = 50;
const SUSPENSE_MS = 3000;
const CHAT_COOLDOWN_MS = 1000;
const ONE_CALL_GRACE_MS = 2000;
const FOUR_COLORS_TURN_MS = 20000;
const POKER_TURN_MS = 30000;

type BroadcastFn = (roomCode: string) => void;

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private playerToRoom = new Map<string, string>();
  private socketToPlayer = new Map<string, string>();
  private suspenseTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private oneCallTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private fourColorsTurnTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pokerTurnTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private chatCooldown = new Map<string, number>();
  private broadcast: BroadcastFn = () => {};

  setBroadcast(fn: BroadcastFn): void {
    this.broadcast = fn;
  }

  generateCode(): string {
    let code: string;
    do {
      code = Array.from({ length: 6 }, () =>
        CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
      ).join("");
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(
    name: string,
    selectedGame: SelectedGame = "entre-extremos",
    mode: GameMode = "couple",
    cardSource: CardSource = "deck",
    cardThemes?: CardTheme[],
    fourColorsOptions: FourColorsOptions = { zeroSwapEnabled: false },
    pokerOptions: PokerOptions = DEFAULT_POKER_OPTIONS
  ): { room: RoomState; player: Player } {
    const code = this.generateCode();
    const player: Player = {
      id: uuidv4(),
      name: name.trim(),
      isHost: true,
      connected: true,
    };

    const room: RoomState = {
      code,
      players: [player],
      score: { [player.id]: 0 },
      teamScore: selectedGame === "entre-extremos" && mode === "teams" ? { A: 0, B: 0 } : undefined,
      status: "lobby",
      selectedGame,
      mode,
      cardSource,
      cardThemes: normalizeCardThemes(cardThemes),
      fourColorsOptions,
      pokerOptions,
      messages: [],
      winningScore: 10,
      usedCardIds: [],
    };

    this.rooms.set(code, room);
    this.playerToRoom.set(player.id, code);
    return { room, player };
  }

  joinRoom(
    code: string,
    name: string,
    playerId?: string
  ): { room: RoomState; player: Player } | { error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      return { error: "Sala não encontrada." };
    }

    if (room.status !== "lobby" && !playerId) {
      return { error: "A partida já começou." };
    }

    const maxPlayers =
      room.selectedGame === "texas-holdem"
        ? MAX_POKER_PLAYERS
        : room.selectedGame === "quatro-cores"
        ? MAX_TEAM_PLAYERS
        : room.mode === "couple"
          ? MAX_COUPLE_PLAYERS
          : MAX_TEAM_PLAYERS;
    const connectedCount = room.players.filter((p) => p.connected).length;

    if (playerId) {
      const existing = room.players.find((p) => p.id === playerId);
      if (existing) {
        existing.connected = true;
        existing.name = name.trim() || existing.name;
        this.playerToRoom.set(existing.id, room.code);
        return { room, player: existing };
      }
      if (room.status !== "lobby") {
        return { error: "Não foi possível reconectar. Entre novamente pelo lobby." };
      }
    }

    if (connectedCount >= maxPlayers) {
      return { error: "Sala cheia." };
    }

    const player: Player = {
      id: uuidv4(),
      name: name.trim(),
      isHost: false,
      connected: true,
    };

    room.players.push(player);
    room.score[player.id] = room.score[player.id] ?? 0;
    this.playerToRoom.set(player.id, room.code);
    return { room, player };
  }

  leaveRoom(playerId: string): RoomState | null {
    const code = this.playerToRoom.get(playerId);
    if (!code) return null;

    const room = this.rooms.get(code);
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
    }

    this.playerToRoom.delete(playerId);
    this.chatCooldown.delete(playerId);

    const connected = room.players.filter((p) => p.connected);
    if (connected.length === 0) {
      this.clearSuspenseTimer(code);
      this.clearOneCallTimersForRoom(code);
      this.clearFourColorsTurnTimer(code);
      this.rooms.delete(code);
      return null;
    }

    if (player?.isHost) {
      const newHost = connected[0];
      newHost.isHost = true;
      room.players.forEach((p) => {
        p.isHost = p.id === newHost.id;
      });
    }

    return room;
  }

  bindSocket(socketId: string, playerId: string): void {
    this.socketToPlayer.set(socketId, playerId);
  }

  unbindSocket(socketId: string): void {
    this.socketToPlayer.delete(socketId);
  }

  getPlayerIdBySocket(socketId: string): string | undefined {
    return this.socketToPlayer.get(socketId);
  }

  getRoomByPlayer(playerId: string): RoomState | undefined {
    const code = this.playerToRoom.get(playerId);
    return code ? this.rooms.get(code) : undefined;
  }

  getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getChatHistory(roomCode: string): ChatMessage[] {
    return this.rooms.get(roomCode)?.messages ?? [];
  }

  setPlayerTeam(playerId: string, team: Team): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.mode !== "teams") {
      return { error: "Modo de times não ativo." };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Jogador não encontrado." };

    player.team = team;
    return {};
  }

  startGame(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return { error: "Sala não encontrada." };

    const host = room.players.find((p) => p.id === playerId);
    if (!host?.isHost) return { error: "Apenas o host pode iniciar." };

    const connected = room.players.filter((p) => p.connected);
    if (room.selectedGame === "quatro-cores" || room.selectedGame === "texas-holdem") {
      if (connected.length < 2) {
        return { error: "São necessários pelo menos 2 jogadores." };
      }
    } else if (room.mode === "couple" && connected.length < 2) {
      return { error: "São necessários 2 jogadores." };
    }

    if (room.selectedGame === "entre-extremos" && room.mode === "teams") {
      const teamA = connected.filter((p) => p.team === "A");
      const teamB = connected.filter((p) => p.team === "B");
      if (teamA.length === 0 || teamB.length === 0) {
        return { error: "Cada time precisa de pelo menos 1 jogador." };
      }
    }

    room.usedCardIds = [];
    connected.forEach((p) => {
      room.score[p.id] =
        room.selectedGame === "quatro-cores" || room.selectedGame === "texas-holdem"
          ? (room.score[p.id] ?? 0)
          : 0;
    });
    if (room.teamScore) {
      room.teamScore = { A: 0, B: 0 };
    }

    if (room.selectedGame === "quatro-cores") {
      const result = startFourColorsGame(room);
      if (result.error) return result;
      this.scheduleFourColorsTurnTimer(room);
      return result;
    }

    if (room.selectedGame === "texas-holdem") {
      const result = startPokerGame(room);
      if (result.error) return result;
      this.schedulePokerTurnTimer(room);
      return result;
    }

    room.status = "playing";
    this.startRound(room);
    return {};
  }

  private startRound(room: RoomState): void {
    this.clearSuspenseTimer(room.code);
    const connected = room.players.filter((p) => p.connected);
    const roundNumber = (room.currentRound?.roundNumber ?? 0) + 1;

    let psychicPlayerId: string;
    let activeTeam: Team | undefined;

    if (room.mode === "couple") {
      const psychicIndex = (roundNumber - 1) % connected.length;
      psychicPlayerId = connected[psychicIndex].id;
    } else {
      activeTeam = roundNumber % 2 === 1 ? "A" : "B";
      const teamPlayers = connected.filter((p) => p.team === activeTeam);
      const psychicIndex = Math.floor((roundNumber - 1) / 2) % teamPlayers.length;
      psychicPlayerId = teamPlayers[psychicIndex]?.id ?? connected[0].id;
    }

    const targetPosition = randomTargetPosition();

    if (room.cardSource === "free") {
      const round: RoundState = {
        roundNumber,
        activeTeam,
        psychicPlayerId,
        card: { id: "custom", left: "", right: "" },
        targetPosition,
        revealed: false,
        phase: "psychic_theme",
      };
      room.currentRound = round;
      room.gameState = {
        kind: "entre-extremos",
        currentRound: round,
        usedCardIds: room.usedCardIds,
      };
      return;
    }

    const card = pickRandomCard(room.usedCardIds, room.cardThemes);
    room.usedCardIds.push(card.id);

    const round: RoundState = {
      roundNumber,
      activeTeam,
      psychicPlayerId,
      card,
      targetPosition,
      revealed: false,
      phase: "psychic_clue",
    };

    room.currentRound = round;
    room.gameState = {
      kind: "entre-extremos",
      currentRound: round,
      usedCardIds: room.usedCardIds,
    };
  }

  submitTheme(playerId: string, left: string, right: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.currentRound) return { error: "Rodada não encontrada." };

    const round = room.currentRound;
    if (round.phase !== "psychic_theme") return { error: "Não é hora de definir o tema." };
    if (round.psychicPlayerId !== playerId) return { error: "Apenas o psíquico pode definir o tema." };

    const leftTrim = left.trim();
    const rightTrim = right.trim();
    if (leftTrim.length < 2 || leftTrim.length > 30) {
      return { error: "Extremo esquerdo inválido (2-30 caracteres)." };
    }
    if (rightTrim.length < 2 || rightTrim.length > 30) {
      return { error: "Extremo direito inválido (2-30 caracteres)." };
    }

    round.card = { id: "custom", left: leftTrim, right: rightTrim };
    round.phase = "psychic_clue";
    return {};
  }

  submitClue(playerId: string, clue: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.currentRound) return { error: "Rodada não encontrada." };

    const round = room.currentRound;
    if (round.phase !== "psychic_clue") return { error: "Não é hora de enviar dica." };
    if (round.psychicPlayerId !== playerId) return { error: "Apenas o psíquico pode enviar dica." };

    const trimmed = clue.trim();
    if (!trimmed || trimmed.length > 100) {
      return { error: "Dica inválida (1-100 caracteres)." };
    }

    round.clue = trimmed;
    round.phase = "guess";
    return {};
  }

  submitGuess(playerId: string, position: number): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.currentRound) return { error: "Rodada não encontrada." };

    const round = room.currentRound;
    if (round.phase !== "guess") return { error: "Não é hora de palpitar." };
    if (round.psychicPlayerId === playerId) return { error: "O psíquico não pode palpitar." };

    if (room.mode === "teams") {
      const player = room.players.find((p) => p.id === playerId);
      if (player?.team !== round.activeTeam) {
        return { error: "Apenas o time ativo pode palpitar." };
      }
    } else {
      const guesserId = room.players.find((p) => p.id !== round.psychicPlayerId && p.connected)?.id;
      if (guesserId !== playerId) return { error: "Apenas o palpiteiro pode enviar palpite." };
    }

    if (position < 0 || position > 100 || !Number.isFinite(position)) {
      return { error: "Posição inválida (0-100)." };
    }

    round.guessPosition = Math.round(position);
    round.phase = room.mode === "teams" ? "opponent_direction" : "suspense";
    round.revealed = false;

    if (room.mode === "couple") {
      this.scheduleSuspenseReveal(room);
    }

    return {};
  }

  submitDirection(playerId: string, direction: "left" | "right"): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.currentRound || room.mode !== "teams") {
      return { error: "Aposta adversária indisponível." };
    }

    const round = room.currentRound;
    if (round.phase !== "opponent_direction") {
      return { error: "Não é hora de apostar direção." };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player?.team || player.team === round.activeTeam) {
      return { error: "Apenas o time adversário pode apostar." };
    }

    round.opponentDirectionGuess = direction;
    round.phase = "suspense";
    round.revealed = false;
    this.scheduleSuspenseReveal(room);
    return {};
  }

  private scheduleSuspenseReveal(room: RoomState): void {
    this.clearSuspenseTimer(room.code);
    const code = room.code;
    const timer = setTimeout(() => {
      this.suspenseTimers.delete(code);
      const r = this.rooms.get(code);
      if (!r?.currentRound || r.currentRound.phase !== "suspense") return;
      r.currentRound.phase = "reveal";
      r.currentRound.revealed = true;
      this.applyRoundScoring(r);
      this.broadcast(code);
    }, SUSPENSE_MS);
    this.suspenseTimers.set(code, timer);
  }

  private clearSuspenseTimer(roomCode: string): void {
    const timer = this.suspenseTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.suspenseTimers.delete(roomCode);
    }
  }

  private oneCallTimerKey(roomCode: string, playerId: string): string {
    return `${roomCode}:${playerId}`;
  }

  private clearOneCallTimer(roomCode: string, playerId: string): void {
    const key = this.oneCallTimerKey(roomCode, playerId);
    const timer = this.oneCallTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.oneCallTimers.delete(key);
    }
  }

  private clearOneCallTimersForRoom(roomCode: string): void {
    for (const [key, timer] of this.oneCallTimers) {
      if (key.startsWith(`${roomCode}:`)) {
        clearTimeout(timer);
        this.oneCallTimers.delete(key);
      }
    }
  }

  private scheduleOneCallPenalty(room: RoomState, playerId: string): void {
    this.clearOneCallTimer(room.code, playerId);
    if (!playerNeedsOneCall(room, playerId)) return;

    const key = this.oneCallTimerKey(room.code, playerId);
    const timer = setTimeout(() => {
      this.oneCallTimers.delete(key);
      const currentRoom = this.rooms.get(room.code);
      if (!currentRoom || currentRoom.status !== "playing") return;
      if (penalizeMissedOne(currentRoom, playerId)) {
        this.broadcast(currentRoom.code);
      }
    }, ONE_CALL_GRACE_MS);

    this.oneCallTimers.set(key, timer);
  }

  private clearFourColorsTurnTimer(roomCode: string): void {
    const timer = this.fourColorsTurnTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.fourColorsTurnTimers.delete(roomCode);
    }
  }

  private scheduleFourColorsTurnTimer(room: RoomState): void {
    this.clearFourColorsTurnTimer(room.code);
    if (
      room.status !== "playing" ||
      room.selectedGame !== "quatro-cores" ||
      room.gameState?.kind !== "four-colors" ||
      room.gameState.winnerId
    ) {
      if (room.gameState?.kind === "four-colors") {
        room.gameState.turnDeadlineAt = undefined;
      }
      return;
    }

    const playerId = room.gameState.currentPlayerId;
    room.gameState.turnDeadlineAt = Date.now() + FOUR_COLORS_TURN_MS;
    const timer = setTimeout(() => {
      this.fourColorsTurnTimers.delete(room.code);
      const currentRoom = this.rooms.get(room.code);
      if (!currentRoom || currentRoom.status !== "playing") return;
      if (penalizeTurnTimeout(currentRoom, playerId)) {
        this.scheduleFourColorsTurnTimer(currentRoom);
        this.broadcast(currentRoom.code);
      }
    }, FOUR_COLORS_TURN_MS);

    this.fourColorsTurnTimers.set(room.code, timer);
  }

  private clearPokerTurnTimer(roomCode: string): void {
    const timer = this.pokerTurnTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.pokerTurnTimers.delete(roomCode);
    }
    const room = this.rooms.get(roomCode);
    if (room?.gameState?.kind === "poker") {
      room.gameState.turnDeadlineAt = undefined;
    }
  }

  private schedulePokerTurnTimer(room: RoomState): void {
    this.clearPokerTurnTimer(room.code);
    if (
      room.status !== "playing" ||
      room.selectedGame !== "texas-holdem" ||
      room.gameState?.kind !== "poker"
    ) {
      return;
    }

    const state = room.gameState;
    if (
      state.isGameOver ||
      state.phase === "hand-ended" ||
      state.phase === "waiting" ||
      state.phase === "showdown" ||
      !state.currentPlayerId
    ) {
      state.turnDeadlineAt = undefined;
      return;
    }

    const player = state.players.find((p) => p.playerId === state.currentPlayerId);
    if (!player || player.status !== "active" || player.chips <= 0) {
      state.turnDeadlineAt = undefined;
      return;
    }

    const playerId = state.currentPlayerId;
    state.turnDeadlineAt = Date.now() + POKER_TURN_MS;
    const timer = setTimeout(() => {
      this.pokerTurnTimers.delete(room.code);
      const currentRoom = this.rooms.get(room.code);
      if (!currentRoom || currentRoom.status !== "playing") return;
      if (penalizePokerTurnTimeout(currentRoom, playerId)) {
        this.schedulePokerTurnTimer(currentRoom);
        this.broadcast(currentRoom.code);
      }
    }, POKER_TURN_MS);

    this.pokerTurnTimers.set(room.code, timer);
  }

  sendChat(playerId: string, text: string): { error?: string; message?: ChatMessage } {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return { error: "Sala não encontrada." };

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Jogador não encontrado." };

    const now = Date.now();
    const last = this.chatCooldown.get(playerId) ?? 0;
    if (now - last < CHAT_COOLDOWN_MS) {
      return { error: "Aguarde um momento antes de enviar outra mensagem." };
    }

    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 200) {
      return { error: "Mensagem inválida (1-200 caracteres)." };
    }

    const message: ChatMessage = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      text: trimmed,
      at: now,
    };

    room.messages.push(message);
    if (room.messages.length > MAX_CHAT_MESSAGES) {
      room.messages = room.messages.slice(-MAX_CHAT_MESSAGES);
    }

    this.chatCooldown.set(playerId, now);
    return { message };
  }

  private applyRoundScoring(room: RoomState): void {
    const round = room.currentRound!;
    if (round.guessPosition === undefined) return;

    const guesserId =
      room.mode === "couple"
        ? room.players.find((p) => p.id !== round.psychicPlayerId && p.connected)?.id
        : room.players.find((p) => p.team === round.activeTeam && p.id !== round.psychicPlayerId)?.id ??
          room.players.find((p) => p.team === round.activeTeam)?.id;

    if (!guesserId) return;

    const result = calculateRoundResult(
      round.targetPosition,
      round.guessPosition,
      guesserId,
      round.opponentDirectionGuess
    );

    round.lastRoundPoints = result.guesserPoints;
    round.lastRoundGuesserId = guesserId;
    room.score[guesserId] = (room.score[guesserId] ?? 0) + result.guesserPoints;

    if (room.mode === "teams" && room.teamScore && round.activeTeam) {
      room.teamScore[round.activeTeam] += result.guesserPoints;
      const opponentTeam = round.activeTeam === "A" ? "B" : "A";
      room.teamScore[opponentTeam] += result.opponentPoints;
    }

    if (this.checkGameOver(room)) {
      room.status = "finished";
      room.currentRound!.phase = "ended";
    }
  }

  nextRound(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return { error: "Sala não encontrada." };

    const host = room.players.find((p) => p.id === playerId);
    if (!host?.isHost) return { error: "Apenas o host pode avançar." };

    if (room.status === "finished") return { error: "Partida encerrada." };
    if (room.currentRound?.phase !== "reveal" && room.currentRound?.phase !== "ended") {
      return { error: "Aguarde a revelação da rodada." };
    }

    if (this.checkGameOver(room)) {
      room.status = "finished";
      return {};
    }

    this.startRound(room);
    return {};
  }

  restartGame(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return { error: "Sala não encontrada." };

    const host = room.players.find((p) => p.id === playerId);
    if (!host?.isHost) return { error: "Apenas o host pode reiniciar." };

    this.clearSuspenseTimer(room.code);
    this.clearOneCallTimersForRoom(room.code);
    this.clearFourColorsTurnTimer(room.code);
    this.clearPokerTurnTimer(room.code);
    room.status = "lobby";
    room.currentRound = undefined;
    room.usedCardIds = [];
    room.players.filter((p) => p.connected).forEach((p) => {
      room.score[p.id] =
        room.selectedGame === "quatro-cores" || room.selectedGame === "texas-holdem"
          ? (room.score[p.id] ?? 0)
          : 0;
    });
    if (room.teamScore) {
      room.teamScore = { A: 0, B: 0 };
    }
    room.gameState = undefined;
    return {};
  }

  private checkGameOver(room: RoomState): boolean {
    if (room.mode === "teams" && room.teamScore) {
      return getTeamWinners(room.teamScore, room.winningScore).length > 0;
    }
    return getWinners(room.score, room.winningScore).length > 0;
  }

  getWinnersForRoom(room: RoomState): string[] {
    if (room.selectedGame === "quatro-cores" && room.gameState?.kind === "four-colors") {
      return room.gameState.winnerId ? [room.gameState.winnerId] : [];
    }
    return getWinners(room.score, room.winningScore);
  }

  getTeamWinnersForRoom(room: RoomState): Team[] {
    if (!room.teamScore) return [];
    return getTeamWinners(room.teamScore, room.winningScore);
  }

  toClientState(room: RoomState, playerId: string): ClientRoomState {
    const round = room.currentRound;
    let clientRound: ClientRoundState | undefined;

    if (round) {
      const isPsychic = round.psychicPlayerId === playerId;
      const canSeeTarget =
        (isPsychic && round.phase === "psychic_clue") ||
        round.revealed ||
        round.phase === "reveal" ||
        round.phase === "ended";

      clientRound = {
        roundNumber: round.roundNumber,
        activeTeam: round.activeTeam,
        psychicPlayerId: round.psychicPlayerId,
        card: round.card,
        clue: round.clue,
        guessPosition: round.guessPosition,
        opponentDirectionGuess: round.opponentDirectionGuess,
        lastRoundPoints: round.lastRoundPoints,
        lastRoundGuesserId: round.lastRoundGuesserId,
        revealed: round.revealed,
        phase: round.phase,
      };

      if (canSeeTarget) {
        clientRound.targetPosition = round.targetPosition;
      }
    }

    return {
      code: room.code,
      players: room.players,
      score: room.score,
      teamScore: room.teamScore,
      status: room.status,
      selectedGame: room.selectedGame,
      mode: room.mode,
      cardSource: room.cardSource,
      cardThemes: room.cardThemes,
      fourColorsOptions: room.fourColorsOptions,
      pokerOptions: room.pokerOptions,
      messages: room.messages,
      currentRound: clientRound,
      gameState:
        room.selectedGame === "texas-holdem"
          ? toClientPokerState(room, playerId)
          : room.selectedGame === "quatro-cores"
          ? toClientFourColorsState(room, playerId)
          : { kind: "entre-extremos", currentRound: clientRound },
      winningScore: room.winningScore,
      playerId,
    };
  }

  playFourColorsCard(playerId: string, cardId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "quatro-cores") return { error: "Jogo indisponível." };
    const result = playCard(room, playerId, cardId);
    if (!result.error) {
      this.scheduleOneCallPenalty(room, playerId);
      this.scheduleFourColorsTurnTimer(room);
    }
    return result;
  }

  drawFourColorsCard(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "quatro-cores") return { error: "Jogo indisponível." };
    const result = drawCard(room, playerId);
    if (!result.error) this.scheduleFourColorsTurnTimer(room);
    return result;
  }

  passFourColorsTurn(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "quatro-cores") return { error: "Jogo indisponível." };
    const result = passTurn(room, playerId);
    if (!result.error) this.scheduleFourColorsTurnTimer(room);
    return result;
  }

  chooseFourColorsColor(playerId: string, color: CardColor): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "quatro-cores") return { error: "Jogo indisponível." };
    const result = chooseColor(room, playerId, color);
    if (!result.error) this.scheduleFourColorsTurnTimer(room);
    return result;
  }

  callFourColorsOne(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "quatro-cores") return { error: "Jogo indisponível." };
    const result = callOne(room, playerId);
    if (!result.error) this.clearOneCallTimer(room.code, playerId);
    return result;
  }

  challengeFourColorsOne(playerId: string, targetPlayerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "quatro-cores") return { error: "Jogo indisponível." };
    const result = challengeOne(room, playerId, targetPlayerId);
    if (!result.error) this.clearOneCallTimer(room.code, targetPlayerId);
    return result;
  }

  chooseFourColorsHandSwapTarget(playerId: string, targetPlayerId?: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "quatro-cores") return { error: "Jogo indisponível." };
    const result = chooseHandSwapTarget(room, playerId, targetPlayerId);
    if (!result.error) this.scheduleFourColorsTurnTimer(room);
    return result;
  }

  foldPoker(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "texas-holdem") return { error: "Jogo indisponível." };
    const result = foldPoker(room, playerId);
    if (!result.error) this.schedulePokerTurnTimer(room);
    return result;
  }

  checkPoker(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "texas-holdem") return { error: "Jogo indisponível." };
    const result = checkPoker(room, playerId);
    if (!result.error) this.schedulePokerTurnTimer(room);
    return result;
  }

  callPoker(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "texas-holdem") return { error: "Jogo indisponível." };
    const result = callPoker(room, playerId);
    if (!result.error) this.schedulePokerTurnTimer(room);
    return result;
  }

  betPoker(playerId: string, amount: number): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "texas-holdem") return { error: "Jogo indisponível." };
    const result = betPoker(room, playerId, amount);
    if (!result.error) this.schedulePokerTurnTimer(room);
    return result;
  }

  raisePoker(playerId: string, amount: number): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "texas-holdem") return { error: "Jogo indisponível." };
    const result = raisePoker(room, playerId, amount);
    if (!result.error) this.schedulePokerTurnTimer(room);
    return result;
  }

  allInPoker(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "texas-holdem") return { error: "Jogo indisponível." };
    const result = allInPoker(room, playerId);
    if (!result.error) this.schedulePokerTurnTimer(room);
    return result;
  }

  nextPokerHand(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "texas-holdem") return { error: "Jogo indisponível." };
    const host = room.players.find((player) => player.id === playerId);
    if (!host?.isHost) return { error: "Apenas o host pode avançar a mão." };
    const result = nextPokerHand(room);
    if (!result.error) this.schedulePokerTurnTimer(room);
    return result;
  }

  restartPokerGame(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.selectedGame !== "texas-holdem") return { error: "Jogo indisponível." };
    const host = room.players.find((player) => player.id === playerId);
    if (!host?.isHost) return { error: "Apenas o host pode reiniciar." };

    this.clearPokerTurnTimer(room.code);
    room.status = "playing";
    room.currentRound = undefined;
    room.usedCardIds = [];
    room.players.filter((player) => player.connected).forEach((player) => {
      room.score[player.id] = room.score[player.id] ?? 0;
    });
    room.gameState = undefined;
    const result = startPokerGame(room);
    if (!result.error) this.schedulePokerTurnTimer(room);
    return result;
  }
}

export const roomManager = new RoomManager();
