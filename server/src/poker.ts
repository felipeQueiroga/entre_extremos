import type {
  ClientPokerGameState,
  PokerCard,
  PokerGameState,
  PokerHandResult,
  PokerOptions,
  PokerPlayerState,
  PokerRank,
  PokerSuit,
  RoomState,
} from "@entre-extremos/shared";

const SUITS: PokerSuit[] = ["clubs", "diamonds", "hearts", "spades"];
const RANKS: PokerRank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_VALUE: Record<PokerRank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const HAND_LABELS = [
  "Carta alta",
  "Um par",
  "Dois pares",
  "Trinca",
  "Sequência",
  "Flush",
  "Full house",
  "Quadra",
  "Straight flush",
  "Royal flush",
] as const;

export const DEFAULT_POKER_OPTIONS: PokerOptions = {
  startingChips: 1000,
  smallBlind: 10,
  bigBlind: 20,
};

interface EvaluatedHand {
  rank: number;
  values: number[];
  label: string;
  cards: PokerCard[];
}

function getPokerState(room: RoomState): PokerGameState | undefined {
  return room.gameState?.kind === "poker" ? room.gameState : undefined;
}

function playerName(room: RoomState, playerId: string): string {
  return room.players.find((player) => player.id === playerId)?.name ?? "Jogador";
}

function createDeck(): PokerCard[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${rank}-${suit}`, rank, suit })));
}

function shuffleDeck<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function normalizeOptions(options?: Partial<PokerOptions>): PokerOptions {
  const startingChips = Math.max(200, Math.min(100000, Math.floor(options?.startingChips ?? DEFAULT_POKER_OPTIONS.startingChips)));
  const smallBlind = Math.max(1, Math.min(startingChips, Math.floor(options?.smallBlind ?? DEFAULT_POKER_OPTIONS.smallBlind)));
  const bigBlind = Math.max(smallBlind * 2, Math.min(startingChips, Math.floor(options?.bigBlind ?? DEFAULT_POKER_OPTIONS.bigBlind)));
  return { startingChips, smallBlind, bigBlind };
}

function nextIndex(state: PokerGameState, fromIndex: number, predicate: (player: PokerPlayerState) => boolean): number {
  const count = state.playerOrder.length;
  for (let offset = 1; offset <= count; offset += 1) {
    const index = (fromIndex + offset) % count;
    const player = state.players.find((p) => p.playerId === state.playerOrder[index]);
    if (player && predicate(player)) return index;
  }
  return fromIndex;
}

function playerIndex(state: PokerGameState, playerId: string): number {
  return state.playerOrder.indexOf(playerId);
}

function getPlayer(state: PokerGameState, playerId: string): PokerPlayerState | undefined {
  return state.players.find((player) => player.playerId === playerId);
}

function canAct(player: PokerPlayerState): boolean {
  return player.status === "active" && player.chips > 0;
}

function inHand(player: PokerPlayerState): boolean {
  return player.status !== "folded" && player.status !== "out";
}

function commitChips(player: PokerPlayerState, amount: number): number {
  const committed = Math.max(0, Math.min(player.chips, Math.floor(amount)));
  player.chips -= committed;
  player.currentBet += committed;
  player.totalCommitted += committed;
  if (player.chips === 0 && player.status !== "folded" && player.status !== "out") {
    player.status = "all-in";
  }
  return committed;
}

function resetStreetBets(state: PokerGameState): void {
  state.currentBet = 0;
  for (const player of state.players) {
    player.currentBet = 0;
    player.hasActed = player.status !== "active";
  }
}

function activeNotFolded(state: PokerGameState): PokerPlayerState[] {
  return state.players.filter(inHand);
}

function actingPlayers(state: PokerGameState): PokerPlayerState[] {
  return state.players.filter(canAct);
}

function setNextActorAfter(state: PokerGameState, startIndex: number): void {
  const next = nextIndex(state, startIndex, canAct);
  const playerId = state.playerOrder[next];
  const player = getPlayer(state, playerId);
  state.currentPlayerId = player && canAct(player) ? playerId : undefined;
}

function isBettingComplete(state: PokerGameState): boolean {
  const actors = actingPlayers(state);
  if (actors.length === 0) return true;
  return actors.every((player) => player.hasActed && player.currentBet === state.currentBet);
}

function revealTo(state: PokerGameState, count: number): void {
  while (state.communityCards.length < count) {
    const card = state.deck.shift();
    if (!card) break;
    state.communityCards.push(card);
  }
}

function compareEvaluated(a: EvaluatedHand, b: EvaluatedHand): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  const max = Math.max(a.values.length, b.values.length);
  for (let i = 0; i < max; i += 1) {
    const diff = (a.values[i] ?? 0) - (b.values[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  return [
    ...combinations(rest, size - 1).map((combo) => [first, ...combo]),
    ...combinations(rest, size),
  ];
}

function straightHigh(values: number[]): number | undefined {
  const unique = [...new Set(values)].sort((a, b) => b - a);
  if (unique.includes(14)) unique.push(1);
  for (let i = 0; i <= unique.length - 5; i += 1) {
    const slice = unique.slice(i, i + 5);
    if (slice[0] - slice[4] === 4) return slice[0] === 1 ? 5 : slice[0];
  }
  return undefined;
}

function evaluateFive(cards: PokerCard[]): EvaluatedHand {
  const values = cards.map((card) => RANK_VALUE[card.rank]).sort((a, b) => b - a);
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const straight = straightHigh(values);

  if (flush && straight) {
    const rank = straight === 14 ? 9 : 8;
    return { rank, values: [straight], label: HAND_LABELS[rank], cards };
  }
  if (groups[0][1] === 4) {
    const kicker = groups.find(([, count]) => count === 1)?.[0] ?? 0;
    return { rank: 7, values: [groups[0][0], kicker], label: HAND_LABELS[7], cards };
  }
  if (groups[0][1] === 3 && groups[1]?.[1] === 2) {
    return { rank: 6, values: [groups[0][0], groups[1][0]], label: HAND_LABELS[6], cards };
  }
  if (flush) return { rank: 5, values, label: HAND_LABELS[5], cards };
  if (straight) return { rank: 4, values: [straight], label: HAND_LABELS[4], cards };
  if (groups[0][1] === 3) {
    const kickers = groups.filter(([, count]) => count === 1).map(([value]) => value);
    return { rank: 3, values: [groups[0][0], ...kickers], label: HAND_LABELS[3], cards };
  }
  if (groups[0][1] === 2 && groups[1]?.[1] === 2) {
    const pairs = groups.filter(([, count]) => count === 2).map(([value]) => value);
    const kicker = groups.find(([, count]) => count === 1)?.[0] ?? 0;
    return { rank: 2, values: [...pairs, kicker], label: HAND_LABELS[2], cards };
  }
  if (groups[0][1] === 2) {
    const kickers = groups.filter(([, count]) => count === 1).map(([value]) => value);
    return { rank: 1, values: [groups[0][0], ...kickers], label: HAND_LABELS[1], cards };
  }
  return { rank: 0, values, label: HAND_LABELS[0], cards };
}

export function evaluatePokerHand(cards: PokerCard[]): EvaluatedHand {
  return combinations(cards, 5).reduce<EvaluatedHand | undefined>((best, combo) => {
    const evaluated = evaluateFive(combo);
    return !best || compareEvaluated(evaluated, best) > 0 ? evaluated : best;
  }, undefined) ?? evaluateFive(cards.slice(0, 5));
}

function finishHand(room: RoomState, state: PokerGameState): void {
  const contenders = activeNotFolded(state);
  if (contenders.length === 1) {
    const winner = contenders[0];
    winner.chips += state.pot;
    state.winners = [winner.playerId];
    state.handResults = [{ playerId: winner.playerId, label: "Venceu por desistência", cards: winner.hand }];
  } else {
    const results = contenders.map((player) => ({
      player,
      hand: evaluatePokerHand([...player.hand, ...state.communityCards]),
    }));
    const paidWinners = new Set<string>();
    const levels = [...new Set(state.players
      .map((player) => player.totalCommitted)
      .filter((amount) => amount > 0))]
      .sort((a, b) => a - b);
    let previousLevel = 0;

    for (const level of levels) {
      const pot = state.players
        .filter((player) => player.totalCommitted >= level)
        .reduce((sum) => sum + level - previousLevel, 0);
      const eligible = results.filter((result) => result.player.totalCommitted >= level);
      if (pot <= 0 || eligible.length === 0) {
        previousLevel = level;
        continue;
      }
      const best = eligible.reduce((current, result) =>
        compareEvaluated(result.hand, current.hand) > 0 ? result : current
      );
      const winners = eligible.filter((result) => compareEvaluated(result.hand, best.hand) === 0);
      const share = Math.floor(pot / winners.length);
      const remainder = pot % winners.length;
      winners.forEach((winner, index) => {
        winner.player.chips += share + (index === 0 ? remainder : 0);
        paidWinners.add(winner.player.playerId);
      });
      previousLevel = level;
    }

    state.winners = [...paidWinners];
    state.handResults = results.map((result) => ({
      playerId: result.player.playerId,
      label: result.hand.label,
      cards: result.hand.cards,
    }));
  }

  state.phase = "hand-ended";
  state.currentPlayerId = undefined;
  state.currentBet = 0;
  state.pot = 0;
  const winnerLabels = [
    ...new Set(
      state.handResults
        ?.filter((result) => state.winners?.includes(result.playerId))
        .map((result) => result.label)
        .filter((label) => label !== "Venceu por desistência") ?? []
    ),
  ];
  const handLabel = winnerLabels.length > 0 ? ` com ${winnerLabels.join(" / ")}` : "";
  state.lastAction = `${state.winners.map((id) => playerName(room, id)).join(", ")} venceu a mão${handLabel}.`;
}

function advanceAfterAction(room: RoomState, state: PokerGameState): void {
  if (activeNotFolded(state).length <= 1) {
    finishHand(room, state);
    return;
  }

  if (!isBettingComplete(state)) {
    const currentIndex = state.currentPlayerId ? playerIndex(state, state.currentPlayerId) : state.dealerIndex;
    setNextActorAfter(state, currentIndex);
    return;
  }

  if (state.phase === "preflop") {
    state.phase = "flop";
    revealTo(state, 3);
  } else if (state.phase === "flop") {
    state.phase = "turn";
    revealTo(state, 4);
  } else if (state.phase === "turn") {
    state.phase = "river";
    revealTo(state, 5);
  } else {
    revealTo(state, 5);
    finishHand(room, state);
    return;
  }

  resetStreetBets(state);
  if (actingPlayers(state).length === 0) {
    advanceAfterAction(room, state);
    return;
  }
  setNextActorAfter(state, state.dealerIndex);
}

function startHand(room: RoomState, previous?: PokerGameState): { error?: string } {
  const options = normalizeOptions(room.pokerOptions);
  room.pokerOptions = options;
  const connectedIds = room.players.filter((player) => player.connected).map((player) => player.id);
  const previousPlayers = previous?.players ?? [];
  const players: PokerPlayerState[] = connectedIds.map((playerId) => {
    const existing = previousPlayers.find((player) => player.playerId === playerId);
    return {
      playerId,
      chips: existing?.chips ?? options.startingChips,
      hand: [],
      currentBet: 0,
      totalCommitted: 0,
      status: (existing?.chips ?? options.startingChips) > 0 ? "active" : "out",
      hasActed: false,
    };
  });
  const activePlayers = players.filter((player) => player.chips > 0);
  if (activePlayers.length < 2) return { error: "São necessários pelo menos 2 jogadores com fichas." };

  const deck = shuffleDeck(createDeck());
  const previousDealer = previous?.dealerIndex ?? -1;
  const state: PokerGameState = {
    kind: "poker",
    handNumber: (previous?.handNumber ?? 0) + 1,
    dealerIndex: 0,
    playerOrder: players.map((player) => player.playerId),
    players,
    deck,
    communityCards: [],
    pot: 0,
    currentBet: options.bigBlind,
    minRaise: options.bigBlind,
    phase: "preflop",
    lastAction: "Nova mão iniciada.",
  };
  state.dealerIndex = nextIndex(state, previousDealer, (player) => player.chips > 0);

  for (let round = 0; round < 2; round += 1) {
    for (const player of players) {
      if (player.chips <= 0) {
        player.status = "out";
        continue;
      }
      const card = state.deck.shift();
      if (card) player.hand.push(card);
    }
  }

  const smallBlindIndex = activePlayers.length === 2
    ? state.dealerIndex
    : nextIndex(state, state.dealerIndex, (player) => player.chips > 0);
  const bigBlindIndex = nextIndex(state, smallBlindIndex, (player) => player.chips > 0);
  const smallBlind = getPlayer(state, state.playerOrder[smallBlindIndex]);
  const bigBlind = getPlayer(state, state.playerOrder[bigBlindIndex]);
  if (smallBlind) state.pot += commitChips(smallBlind, options.smallBlind);
  if (bigBlind) state.pot += commitChips(bigBlind, options.bigBlind);
  if (smallBlind) smallBlind.hasActed = false;
  if (bigBlind) bigBlind.hasActed = false;

  setNextActorAfter(state, bigBlindIndex);
  room.status = "playing";
  room.gameState = state;
  return {};
}

export function startPokerGame(room: RoomState): { error?: string } {
  const connected = room.players.filter((player) => player.connected);
  if (connected.length < 2) return { error: "São necessários pelo menos 2 jogadores." };
  return startHand(room);
}

export function nextPokerHand(room: RoomState): { error?: string } {
  const state = getPokerState(room);
  if (!state) return { error: "Poker não iniciado." };
  if (state.phase !== "hand-ended") return { error: "A mão atual ainda não terminou." };
  return startHand(room, state);
}

function assertCurrentPlayer(room: RoomState, playerId: string): { state?: PokerGameState; player?: PokerPlayerState; error?: string } {
  const state = getPokerState(room);
  if (!state) return { error: "Poker não iniciado." };
  if (state.phase === "hand-ended") return { error: "A mão já terminou." };
  if (state.currentPlayerId !== playerId) return { error: "Não é sua vez." };
  const player = getPlayer(state, playerId);
  if (!player || !canAct(player)) return { error: "Você não pode agir agora." };
  return { state, player };
}

export function foldPoker(room: RoomState, playerId: string): { error?: string } {
  const { state, player, error } = assertCurrentPlayer(room, playerId);
  if (!state || !player) return { error };
  player.status = "folded";
  player.hasActed = true;
  state.lastAction = `${playerName(room, playerId)} desistiu.`;
  advanceAfterAction(room, state);
  return {};
}

export function checkPoker(room: RoomState, playerId: string): { error?: string } {
  const { state, player, error } = assertCurrentPlayer(room, playerId);
  if (!state || !player) return { error };
  if (player.currentBet !== state.currentBet) return { error: "Você precisa pagar ou desistir." };
  player.hasActed = true;
  state.lastAction = `${playerName(room, playerId)} deu check.`;
  advanceAfterAction(room, state);
  return {};
}

export function callPoker(room: RoomState, playerId: string): { error?: string } {
  const { state, player, error } = assertCurrentPlayer(room, playerId);
  if (!state || !player) return { error };
  const toCall = state.currentBet - player.currentBet;
  if (toCall <= 0) return checkPoker(room, playerId);
  state.pot += commitChips(player, toCall);
  player.hasActed = true;
  state.lastAction = `${playerName(room, playerId)} pagou.`;
  advanceAfterAction(room, state);
  return {};
}

export function betPoker(room: RoomState, playerId: string, amount: number): { error?: string } {
  const { state, player, error } = assertCurrentPlayer(room, playerId);
  if (!state || !player) return { error };
  const value = Math.floor(amount);
  if (state.currentBet > 0) return { error: "Já existe aposta. Use aumentar." };
  if (value < state.minRaise) return { error: `Aposta mínima: ${state.minRaise}.` };
  if (value > player.chips) return { error: "Fichas insuficientes." };
  state.pot += commitChips(player, value);
  state.currentBet = player.currentBet;
  player.hasActed = true;
  state.players.forEach((p) => {
    if (p.playerId !== playerId && canAct(p)) p.hasActed = false;
  });
  state.lastAction = `${playerName(room, playerId)} apostou ${value}.`;
  advanceAfterAction(room, state);
  return {};
}

export function raisePoker(room: RoomState, playerId: string, amount: number): { error?: string } {
  const { state, player, error } = assertCurrentPlayer(room, playerId);
  if (!state || !player) return { error };
  const targetBet = Math.floor(amount);
  const raiseBy = targetBet - state.currentBet;
  const toCommit = targetBet - player.currentBet;
  if (state.currentBet <= 0) return { error: "Não há aposta para aumentar." };
  if (raiseBy < state.minRaise) return { error: `Aumento mínimo: ${state.minRaise}.` };
  if (toCommit > player.chips) return { error: "Fichas insuficientes." };
  state.pot += commitChips(player, toCommit);
  state.minRaise = raiseBy;
  state.currentBet = player.currentBet;
  player.hasActed = true;
  state.players.forEach((p) => {
    if (p.playerId !== playerId && canAct(p)) p.hasActed = false;
  });
  state.lastAction = `${playerName(room, playerId)} aumentou para ${targetBet}.`;
  advanceAfterAction(room, state);
  return {};
}

export function allInPoker(room: RoomState, playerId: string): { error?: string } {
  const { state, player, error } = assertCurrentPlayer(room, playerId);
  if (!state || !player) return { error };
  const previousBet = state.currentBet;
  state.pot += commitChips(player, player.chips);
  if (player.currentBet > state.currentBet) {
    state.currentBet = player.currentBet;
    state.minRaise = Math.max(state.minRaise, state.currentBet - previousBet);
    state.players.forEach((p) => {
      if (p.playerId !== playerId && canAct(p)) p.hasActed = false;
    });
  }
  player.hasActed = true;
  state.lastAction = `${playerName(room, playerId)} foi all-in.`;
  advanceAfterAction(room, state);
  return {};
}

export function toClientPokerState(room: RoomState, playerId: string): ClientPokerGameState | undefined {
  const state = getPokerState(room);
  if (!state) return undefined;
  const localPlayer = getPlayer(state, playerId);
  const callAmount = localPlayer ? Math.max(0, state.currentBet - localPlayer.currentBet) : 0;
  const localCanAct = !!localPlayer && state.currentPlayerId === playerId && canAct(localPlayer);
  const showAllCards = state.phase === "showdown" || state.phase === "hand-ended";

  return {
    kind: "poker",
    handNumber: state.handNumber,
    dealerIndex: state.dealerIndex,
    playerOrder: state.playerOrder,
    players: state.players.map((player) => {
      const roomPlayer = room.players.find((p) => p.id === player.playerId);
      return {
        playerId: player.playerId,
        name: roomPlayer?.name ?? "Jogador",
        connected: roomPlayer?.connected ?? false,
        chips: player.chips,
        currentBet: player.currentBet,
        totalCommitted: player.totalCommitted,
        status: player.status,
        hasActed: player.hasActed,
        cards: player.playerId === playerId || showAllCards ? player.hand : undefined,
      };
    }),
    hand: localPlayer?.hand ?? [],
    communityCards: state.communityCards,
    pot: state.pot,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    currentPlayerId: state.currentPlayerId,
    phase: state.phase,
    winners: state.winners,
    handResults: state.handResults,
    lastAction: state.lastAction,
    callAmount,
    minBet: state.currentBet > 0 ? state.currentBet + state.minRaise : state.minRaise,
    canCheck: localCanAct && callAmount === 0,
    canCall: localCanAct && callAmount > 0,
    canBet: localCanAct && state.currentBet === 0,
    canRaise: localCanAct && state.currentBet > 0,
    canFold: localCanAct,
    canAllIn: localCanAct && (localPlayer?.chips ?? 0) > 0,
  };
}
