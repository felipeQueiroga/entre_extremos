import type {
  Card,
  CardColor,
  CardType,
  ClientFourColorsGameState,
  FourColorsGameState,
  FourColorsPendingDrawType,
  FourColorsPlayerState,
  RoomState,
} from "@entre-extremos/shared";

const COLORS: CardColor[] = ["red", "blue", "green", "yellow"];
const ACTIONS: CardType[] = ["skip", "reverse", "draw2"];
const STARTING_HAND_SIZE = 7;

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of COLORS) {
    deck.push({ id: `${color}-0`, type: "number", color, value: 0 });

    for (let copy = 1; copy <= 2; copy += 1) {
      for (let value = 1; value <= 9; value += 1) {
        deck.push({ id: `${color}-${value}-${copy}`, type: "number", color, value });
      }
    }

    for (let copy = 1; copy <= 2; copy += 1) {
      for (const action of ACTIONS) {
        deck.push({ id: `${color}-${action}-${copy}`, type: action, color });
      }
    }
  }

  for (let copy = 1; copy <= 4; copy += 1) {
    deck.push({ id: `wild-${copy}`, type: "wild" });
    deck.push({ id: `wild-draw4-${copy}`, type: "wildDraw4" });
  }

  return deck;
}

export function shuffleDeck<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getFourColorsState(room: RoomState): FourColorsGameState | undefined {
  return room.gameState?.kind === "four-colors" ? room.gameState : undefined;
}

function getPlayerState(
  state: FourColorsGameState,
  playerId: string
): FourColorsPlayerState | undefined {
  return state.players.find((player) => player.playerId === playerId);
}

function topDiscard(state: FourColorsGameState): Card {
  return state.discardPile[state.discardPile.length - 1];
}

function drawFromDeck(state: FourColorsGameState): Card | undefined {
  if (state.deck.length === 0 && state.discardPile.length > 1) {
    const top = topDiscard(state);
    state.deck = shuffleDeck(state.discardPile.slice(0, -1));
    state.discardPile = [top];
  }

  return state.deck.shift();
}

function drawCards(state: FourColorsGameState, playerId: string, amount: number): Card[] {
  const player = getPlayerState(state, playerId);
  if (!player) return [];

  const drawn: Card[] = [];
  for (let i = 0; i < amount; i += 1) {
    const card = drawFromDeck(state);
    if (!card) break;
    player.hand.push(card);
    drawn.push(card);
  }

  if (player.hand.length !== 1) {
    player.hasCalledOne = false;
  }

  return drawn;
}

function playerName(room: RoomState, playerId: string): string {
  return room.players.find((player) => player.id === playerId)?.name ?? "Jogador";
}

function isDrawStackCard(card: Card): card is Card & { type: FourColorsPendingDrawType } {
  return card.type === "draw2" || card.type === "wildDraw4";
}

function isSpecialCard(card: Card): boolean {
  return card.type !== "number";
}

function specialCardLabel(card: Card): string {
  if (card.type === "skip") return "bloqueio";
  if (card.type === "reverse") return "inverter";
  if (card.type === "draw2") return "+2";
  if (card.type === "wild") return "coringa";
  if (card.type === "wildDraw4") return "+4";
  return "especial";
}

function resolvePendingDraw(room: RoomState, state: FourColorsGameState, playerId: string): void {
  const amount = state.pendingDrawAmount ?? 0;
  if (amount <= 0) return;

  drawCards(state, playerId, amount);
  state.pendingDrawAmount = undefined;
  state.pendingDrawType = undefined;
  state.pendingDrawPlayerId = undefined;
  state.currentPlayerId = calculateNextPlayer(state, 1);
  state.lastAction = `${playerName(room, playerId)} comprou ${amount} carta(s) acumuladas.`;
}

export function canPlayCard(card: Card, state: FourColorsGameState): boolean {
  if (state.pendingColorChoice || state.pendingHandSwap) return false;
  if (state.pendingDrawAmount && state.pendingDrawType) {
    return card.type === state.pendingDrawType;
  }
  if (card.type === "wild" || card.type === "wildDraw4") return true;
  if (card.color === state.currentColor) return true;
  if (card.type !== "number" && card.type === state.currentType) return true;
  return card.type === "number" && state.currentType === "number" && card.value === state.currentValue;
}

export function calculateNextPlayer(state: FourColorsGameState, steps: number): string {
  const currentIndex = state.playerOrder.indexOf(state.currentPlayerId);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const count = state.playerOrder.length;
  const nextIndex = (startIndex + state.direction * steps + count * Math.ceil(steps / count + 1)) % count;
  return state.playerOrder[nextIndex];
}

export function applyCardEffect(card: Card, state: FourColorsGameState): void {
  if (card.type === "skip") {
    state.currentPlayerId = calculateNextPlayer(state, 2);
    return;
  }

  if (card.type === "reverse") {
    state.direction = state.direction === 1 ? -1 : 1;
    state.currentPlayerId = calculateNextPlayer(state, state.playerOrder.length === 2 ? 2 : 1);
    return;
  }

  if (card.type === "draw2") {
    const targetId = calculateNextPlayer(state, 1);
    state.pendingDrawAmount = (state.pendingDrawAmount ?? 0) + 2;
    state.pendingDrawType = "draw2";
    state.pendingDrawPlayerId = targetId;
    state.currentPlayerId = targetId;
    return;
  }

  if (card.type === "wild" || card.type === "wildDraw4") {
    state.pendingColorChoice = {
      playerId: state.currentPlayerId,
      cardId: card.id,
      drawAmount: card.type === "wildDraw4" ? 4 : 0,
    };
    return;
  }

  state.currentPlayerId = calculateNextPlayer(state, 1);
}

export function startFourColorsGame(room: RoomState): { error?: string } {
  const connectedPlayers = room.players.filter((player) => player.connected);
  if (connectedPlayers.length < 2) {
    return { error: "São necessários pelo menos 2 jogadores." };
  }

  const deck = shuffleDeck(createDeck());
  const players: FourColorsPlayerState[] = connectedPlayers.map((player) => ({
    playerId: player.id,
    hand: [],
    hasCalledOne: false,
    drewThisTurn: false,
  }));

  for (let round = 0; round < STARTING_HAND_SIZE; round += 1) {
    for (const player of players) {
      const card = deck.shift();
      if (card) player.hand.push(card);
    }
  }

  const initialIndex = deck.findIndex((card) => card.type === "number");
  const [initialDiscard] = deck.splice(initialIndex >= 0 ? initialIndex : 0, 1);

  if (!initialDiscard?.color) {
    return { error: "Não foi possível iniciar o baralho." };
  }

  const state: FourColorsGameState = {
    kind: "four-colors",
    playerOrder: connectedPlayers.map((player) => player.id),
    players,
    deck,
    discardPile: [initialDiscard],
    currentPlayerId: connectedPlayers[0].id,
    direction: 1,
    currentColor: initialDiscard.color,
    currentType: initialDiscard.type,
    currentValue: initialDiscard.value,
    lastAction: "Partida iniciada.",
  };

  room.status = "playing";
  room.gameState = state;
  for (const player of connectedPlayers) {
    room.score[player.id] = room.score[player.id] ?? 0;
  }
  return {};
}

export function playCard(room: RoomState, playerId: string, cardId: string): { error?: string } {
  const state = getFourColorsState(room);
  if (!state) return { error: "Entre Quatro Cores não iniciado." };
  if (state.winnerId) return { error: "Partida encerrada." };
  if (state.pendingColorChoice) return { error: "Escolha a próxima cor antes de continuar." };
  if (state.pendingHandSwap) return { error: "Resolva a troca de mão antes de continuar." };
  if (state.currentPlayerId !== playerId) return { error: "Não é sua vez." };

  const player = getPlayerState(state, playerId);
  if (!player) return { error: "Jogador não encontrado." };

  const cardIndex = player.hand.findIndex((card) => card.id === cardId);
  if (cardIndex < 0) return { error: "Carta não encontrada na sua mão." };

  const card = player.hand[cardIndex];
  if (!canPlayCard(card, state)) return { error: "Essa carta não pode ser jogada agora." };
  if (state.pendingDrawAmount && (!isDrawStackCard(card) || card.type !== state.pendingDrawType)) {
    return { error: "Você só pode empilhar uma carta de compra igual." };
  }

  player.hand.splice(cardIndex, 1);
  player.drewThisTurn = false;
  player.hasCalledOne = false;

  state.discardPile.push(card);
  state.currentType = card.type;
  state.currentValue = card.value;
  if (card.color) state.currentColor = card.color;
  state.lastAction = isSpecialCard(card)
    ? `${playerName(room, playerId)} jogou carta especial (${specialCardLabel(card)}).`
    : `${playerName(room, playerId)} jogou uma carta.`;

  if (player.hand.length === 0) {
    state.winnerId = playerId;
    room.score[playerId] = (room.score[playerId] ?? 0) + 1;
    room.status = "finished";
    state.lastAction = `${playerName(room, playerId)} venceu a partida.`;
    return {};
  }

  if (
    room.fourColorsOptions.zeroSwapEnabled &&
    card.type === "number" &&
    card.value === 0 &&
    state.playerOrder.length > 1
  ) {
    state.pendingHandSwap = { playerId };
    state.lastAction = `${playerName(room, playerId)} jogou 0 e pode trocar de mão.`;
    return {};
  }

  applyCardEffect(card, state);
  return {};
}

export function drawCard(room: RoomState, playerId: string): { error?: string } {
  const state = getFourColorsState(room);
  if (!state) return { error: "Entre Quatro Cores não iniciado." };
  if (state.winnerId) return { error: "Partida encerrada." };
  if (state.pendingColorChoice) return { error: "Aguarde a escolha da cor." };
  if (state.pendingHandSwap) return { error: "Resolva a troca de mão antes de comprar." };
  if (state.currentPlayerId !== playerId) return { error: "Não é sua vez." };

  const player = getPlayerState(state, playerId);
  if (!player) return { error: "Jogador não encontrado." };

  if (state.pendingDrawAmount) {
    resolvePendingDraw(room, state, playerId);
    return {};
  }

  const card = drawFromDeck(state);
  if (!card) {
    return { error: "Não há cartas disponíveis para comprar." };
  }

  player.hand.push(card);
  player.drewThisTurn = true;
  player.hasCalledOne = player.hand.length === 1 ? player.hasCalledOne : false;
  const playable = canPlayCard(card, state);
  state.lastAction = `${playerName(room, playerId)} comprou 1 carta${playable ? " jogável" : ""}.`;
  if (!playable) {
    player.drewThisTurn = false;
    state.currentPlayerId = calculateNextPlayer(state, 1);
    state.lastAction = `${playerName(room, playerId)} comprou 1 carta e passou a vez.`;
  }
  return {};
}

export function passTurn(room: RoomState, playerId: string): { error?: string } {
  const state = getFourColorsState(room);
  if (!state) return { error: "Entre Quatro Cores não iniciado." };
  if (state.currentPlayerId !== playerId) return { error: "Não é sua vez." };
  if (state.pendingColorChoice) return { error: "Escolha a próxima cor antes de passar." };
  if (state.pendingHandSwap) return { error: "Resolva a troca de mão antes de passar." };

  const player = getPlayerState(state, playerId);
  if (!player) return { error: "Jogador não encontrado." };

  if (state.pendingDrawAmount) {
    resolvePendingDraw(room, state, playerId);
    return {};
  }

  if (!player.drewThisTurn && !player.hand.some((card) => canPlayCard(card, state))) {
    return { error: "Você precisa comprar uma carta antes de passar." };
  }

  player.drewThisTurn = false;
  state.currentPlayerId = calculateNextPlayer(state, 1);
  state.lastAction = `${playerName(room, playerId)} passou a vez.`;
  return {};
}

export function chooseColor(room: RoomState, playerId: string, color: CardColor): { error?: string } {
  const state = getFourColorsState(room);
  if (!state) return { error: "Entre Quatro Cores não iniciado." };
  if (!state.pendingColorChoice) return { error: "Não há cor para escolher." };
  if (state.pendingColorChoice.playerId !== playerId) return { error: "Apenas quem jogou o curinga escolhe a cor." };

  const drawAmount = state.pendingColorChoice.drawAmount;
  state.currentColor = color;
  state.pendingColorChoice = undefined;

  if (drawAmount > 0) {
    const targetId = calculateNextPlayer(state, 1);
    state.pendingDrawAmount = (state.pendingDrawAmount ?? 0) + drawAmount;
    state.pendingDrawType = "wildDraw4";
    state.pendingDrawPlayerId = targetId;
    state.currentPlayerId = targetId;
    state.lastAction = `${playerName(room, playerId)} escolheu ${color}; ${playerName(room, targetId)} deve responder +${state.pendingDrawAmount}.`;
  } else {
    state.currentPlayerId = calculateNextPlayer(state, 1);
    state.lastAction = `${playerName(room, playerId)} escolheu ${color}.`;
  }

  return {};
}

export function chooseHandSwapTarget(
  room: RoomState,
  playerId: string,
  targetPlayerId?: string
): { error?: string } {
  const state = getFourColorsState(room);
  if (!state) return { error: "Entre Quatro Cores não iniciado." };
  if (!state.pendingHandSwap) return { error: "Não há troca de mão pendente." };
  if (state.pendingHandSwap.playerId !== playerId) {
    return { error: "Apenas quem jogou o 0 pode resolver a troca." };
  }

  const player = getPlayerState(state, playerId);
  if (!player) return { error: "Jogador não encontrado." };

  if (targetPlayerId) {
    if (targetPlayerId === playerId) return { error: "Escolha outro jogador para trocar." };
    const target = getPlayerState(state, targetPlayerId);
    if (!target) return { error: "Jogador alvo não encontrado." };

    [player.hand, target.hand] = [target.hand, player.hand];
    player.hasCalledOne = player.hand.length === 1 ? player.hasCalledOne : false;
    target.hasCalledOne = target.hand.length === 1 ? target.hasCalledOne : false;
    state.lastAction = `${playerName(room, playerId)} trocou de mão com ${playerName(room, targetPlayerId)}.`;
  } else {
    state.lastAction = `${playerName(room, playerId)} ignorou a troca de mão.`;
  }

  state.pendingHandSwap = undefined;
  state.currentPlayerId = calculateNextPlayer(state, 1);
  return {};
}

export function callOne(room: RoomState, playerId: string): { error?: string } {
  const state = getFourColorsState(room);
  if (!state) return { error: "Entre Quatro Cores não iniciado." };
  const player = getPlayerState(state, playerId);
  if (!player) return { error: "Jogador não encontrado." };
  if (player.hand.length !== 1) return { error: "Você só pode apertar 1 com exatamente uma carta." };

  player.hasCalledOne = true;
  state.lastAction = `${playerName(room, playerId)} apertou 1.`;
  return {};
}

export function challengeOne(
  room: RoomState,
  challengerId: string,
  targetPlayerId: string
): { error?: string } {
  const state = getFourColorsState(room);
  if (!state) return { error: "Entre Quatro Cores não iniciado." };
  if (challengerId === targetPlayerId) return { error: "Você não pode punir a si mesmo." };

  const target = getPlayerState(state, targetPlayerId);
  if (!target) return { error: "Jogador alvo não encontrado." };
  if (target.hand.length !== 1 || target.hasCalledOne) {
    return { error: "Esse jogador não pode ser punido agora." };
  }

  drawCards(state, targetPlayerId, 2);
  target.hasCalledOne = false;
  state.lastAction = `${playerName(room, challengerId)} puniu ${playerName(room, targetPlayerId)} com +2.`;
  return {};
}

export function playerNeedsOneCall(room: RoomState, playerId: string): boolean {
  const state = getFourColorsState(room);
  const player = state ? getPlayerState(state, playerId) : undefined;
  return !!player && player.hand.length === 1 && !player.hasCalledOne && !state?.winnerId;
}

export function penalizeMissedOne(room: RoomState, targetPlayerId: string): boolean {
  const state = getFourColorsState(room);
  if (!state) return false;

  const target = getPlayerState(state, targetPlayerId);
  if (!target || target.hand.length !== 1 || target.hasCalledOne) return false;

  drawCards(state, targetPlayerId, 2);
  target.hasCalledOne = false;
  state.lastAction = `${playerName(room, targetPlayerId)} esqueceu o 1 e comprou +2.`;
  return true;
}

export function toClientFourColorsState(
  room: RoomState,
  playerId: string
): ClientFourColorsGameState | undefined {
  const state = getFourColorsState(room);
  if (!state || state.discardPile.length === 0) return undefined;

  const localPlayer = getPlayerState(state, playerId);

  return {
    kind: "four-colors",
    playerOrder: state.playerOrder,
    players: state.players.map((player) => {
      const roomPlayer = room.players.find((p) => p.id === player.playerId);
      return {
        playerId: player.playerId,
        name: roomPlayer?.name ?? "Jogador",
        connected: roomPlayer?.connected ?? false,
        cardCount: player.hand.length,
        hasCalledOne: player.hasCalledOne,
      };
    }),
    hand: localPlayer?.hand ?? [],
    deckCount: state.deck.length,
    discardPile: state.discardPile,
    topDiscard: topDiscard(state),
    currentPlayerId: state.currentPlayerId,
    direction: state.direction,
    currentColor: state.currentColor,
    currentType: state.currentType,
    currentValue: state.currentValue,
    pendingColorChoice: state.pendingColorChoice,
    pendingDrawAmount: state.pendingDrawAmount,
    pendingDrawType: state.pendingDrawType,
    pendingDrawPlayerId: state.pendingDrawPlayerId,
    pendingHandSwap: state.pendingHandSwap,
    winnerId: state.winnerId,
    lastAction: state.lastAction,
    canPass:
      state.currentPlayerId === playerId &&
      !state.pendingColorChoice &&
      !state.pendingHandSwap &&
      (!!state.pendingDrawAmount ||
        !!localPlayer?.drewThisTurn ||
        !!localPlayer?.hand.some((card) => canPlayCard(card, state))),
  };
}
