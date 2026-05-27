export type GameMode = "couple" | "teams";

export type CardSource = "deck" | "free";

export type SelectedGame = "entre-extremos" | "quatro-cores" | "texas-holdem";

export const GAME_OPTIONS = [
  {
    id: "entre-extremos",
    label: "Entre Extremos",
    description: "Dicas em uma escala secreta de extremos.",
  },
  {
    id: "quatro-cores",
    label: "Entre Quatro Cores",
    description: "Cartas de cores, números, ações e curingas.",
  },
  {
    id: "texas-holdem",
    label: "Poker Texas Hold'em",
    description: "Blefes, apostas e cartas comunitárias com fichas virtuais.",
  },
] as const satisfies ReadonlyArray<{
  id: SelectedGame;
  label: string;
  description: string;
}>;

export const CARD_THEME_OPTIONS = [
  { id: "relacionamento", label: "Relacionamento" },
  { id: "pets", label: "Pets" },
  { id: "personalidade", label: "Personalidade" },
  { id: "signos", label: "Signos" },
  { id: "viagem", label: "Viagem" },
  { id: "primeiro-encontro", label: "Primeiro encontro" },
  { id: "comida", label: "Comida" },
  { id: "filmes-series", label: "Filmes e séries" },
  { id: "profissoes", label: "Profissões" },
  { id: "lugares", label: "Lugares" },
  { id: "aleatorias", label: "Aleatórias" },
] as const;

export type CardTheme = (typeof CARD_THEME_OPTIONS)[number]["id"];

export const DEFAULT_CARD_THEMES: CardTheme[] = [
  "relacionamento",
  "pets",
  "signos",
  "viagem",
  "primeiro-encontro",
];

export type RoomStatus = "lobby" | "playing" | "finished";

export type RoundPhase =
  | "psychic_theme"
  | "psychic_clue"
  | "guess"
  | "opponent_direction"
  | "suspense"
  | "reveal"
  | "ended";

export type Team = "A" | "B";

export type Direction = "left" | "right";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  team?: Team;
}

export interface ExtremeCard {
  id: string;
  left: string;
  right: string;
}

export type CardColor = "red" | "blue" | "green" | "yellow";

export type CardType = "number" | "skip" | "reverse" | "draw2" | "wild" | "wildDraw4";

export interface Card {
  id: string;
  type: CardType;
  color?: CardColor;
  value?: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  at: number;
}

export interface RoundState {
  roundNumber: number;
  activeTeam?: Team;
  psychicPlayerId: string;
  card: ExtremeCard;
  targetPosition: number;
  clue?: string;
  guessPosition?: number;
  opponentDirectionGuess?: Direction;
  lastRoundPoints?: number;
  lastRoundGuesserId?: string;
  revealed: boolean;
  phase: RoundPhase;
}

export interface TeamScore {
  A: number;
  B: number;
}

export interface FourColorsPlayerState {
  playerId: string;
  hand: Card[];
  hasCalledOne: boolean;
  drewThisTurn: boolean;
}

export interface FourColorsVisiblePlayer {
  playerId: string;
  name: string;
  connected: boolean;
  cardCount: number;
  hasCalledOne: boolean;
}

export interface FourColorsPendingColorChoice {
  playerId: string;
  cardId: string;
  drawAmount: 0 | 4;
}

export interface FourColorsOptions {
  zeroSwapEnabled: boolean;
}

export type FourColorsPendingDrawType = "draw2" | "wildDraw4";

export interface FourColorsPendingHandSwap {
  playerId: string;
}

export interface FourColorsGameState {
  kind: "four-colors";
  playerOrder: string[];
  players: FourColorsPlayerState[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerId: string;
  direction: 1 | -1;
  currentColor: CardColor;
  currentType: CardType;
  currentValue?: number;
  pendingColorChoice?: FourColorsPendingColorChoice;
  pendingDrawAmount?: number;
  pendingDrawType?: FourColorsPendingDrawType;
  pendingDrawPlayerId?: string;
  pendingHandSwap?: FourColorsPendingHandSwap;
  turnDeadlineAt?: number;
  winnerId?: string;
  lastAction?: string;
}

export type PokerSuit = "clubs" | "diamonds" | "hearts" | "spades";

export type PokerRank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface PokerCard {
  id: string;
  suit: PokerSuit;
  rank: PokerRank;
}

export type PokerPhase =
  | "waiting"
  | "preflop"
  | "flop"
  | "turn"
  | "river"
  | "showdown"
  | "hand-ended";

export type PokerPlayerStatus = "active" | "folded" | "all-in" | "out";

export interface PokerOptions {
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
}

export interface PokerPlayerState {
  playerId: string;
  chips: number;
  hand: PokerCard[];
  currentBet: number;
  totalCommitted: number;
  status: PokerPlayerStatus;
  hasActed: boolean;
}

export interface PokerVisiblePlayer {
  playerId: string;
  name: string;
  connected: boolean;
  chips: number;
  currentBet: number;
  totalCommitted: number;
  status: PokerPlayerStatus;
  hasActed: boolean;
  cards?: PokerCard[];
}

export interface PokerHandResult {
  playerId: string;
  label: string;
  cards: PokerCard[];
}

export interface PokerGameState {
  kind: "poker";
  handNumber: number;
  dealerIndex: number;
  playerOrder: string[];
  players: PokerPlayerState[];
  deck: PokerCard[];
  communityCards: PokerCard[];
  pot: number;
  currentBet: number;
  minRaise: number;
  currentPlayerId?: string;
  phase: PokerPhase;
  winners?: string[];
  handResults?: PokerHandResult[];
  lastAction?: string;
}

export interface ClientPokerGameState {
  kind: "poker";
  handNumber: number;
  dealerIndex: number;
  playerOrder: string[];
  players: PokerVisiblePlayer[];
  hand: PokerCard[];
  communityCards: PokerCard[];
  pot: number;
  currentBet: number;
  minRaise: number;
  currentPlayerId?: string;
  phase: PokerPhase;
  winners?: string[];
  handResults?: PokerHandResult[];
  lastAction?: string;
  callAmount: number;
  minBet: number;
  canCheck: boolean;
  canCall: boolean;
  canBet: boolean;
  canRaise: boolean;
  canFold: boolean;
  canAllIn: boolean;
}

export interface ClientFourColorsGameState {
  kind: "four-colors";
  playerOrder: string[];
  players: FourColorsVisiblePlayer[];
  hand: Card[];
  deckCount: number;
  discardPile: Card[];
  topDiscard: Card;
  currentPlayerId: string;
  direction: 1 | -1;
  currentColor: CardColor;
  currentType: CardType;
  currentValue?: number;
  pendingColorChoice?: FourColorsPendingColorChoice;
  pendingDrawAmount?: number;
  pendingDrawType?: FourColorsPendingDrawType;
  pendingDrawPlayerId?: string;
  pendingHandSwap?: FourColorsPendingHandSwap;
  turnDeadlineAt?: number;
  winnerId?: string;
  lastAction?: string;
  canPass: boolean;
}

export interface EntreExtremosGameState {
  kind: "entre-extremos";
  currentRound?: RoundState;
  usedCardIds: string[];
}

export interface ClientEntreExtremosGameState {
  kind: "entre-extremos";
  currentRound?: ClientRoundState;
}

export type GameState = EntreExtremosGameState | FourColorsGameState | PokerGameState;

export type ClientGameState =
  | ClientEntreExtremosGameState
  | ClientFourColorsGameState
  | ClientPokerGameState;

export interface RoomState {
  code: string;
  players: Player[];
  score: Record<string, number>;
  teamScore?: TeamScore;
  status: RoomStatus;
  selectedGame: SelectedGame;
  mode: GameMode;
  cardSource: CardSource;
  cardThemes: CardTheme[];
  fourColorsOptions: FourColorsOptions;
  pokerOptions: PokerOptions;
  messages: ChatMessage[];
  currentRound?: RoundState;
  gameState?: GameState;
  winningScore: number;
  usedCardIds: string[];
}

export interface ClientRoundState extends Omit<RoundState, "targetPosition"> {
  targetPosition?: number;
}

export interface ClientRoomState
  extends Omit<RoomState, "currentRound" | "usedCardIds" | "gameState"> {
  currentRound?: ClientRoundState;
  gameState?: ClientGameState;
  playerId: string;
}

export interface RoundResult {
  distance: number;
  guesserPoints: number;
  opponentPoints: number;
  guesserId: string;
}
