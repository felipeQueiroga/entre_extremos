export type GameMode = "couple" | "teams";

export type CardSource = "deck" | "free";

export type SelectedGame = "entre-extremos" | "quatro-cores";

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
  winnerId?: string;
  lastAction?: string;
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

export type GameState = EntreExtremosGameState | FourColorsGameState;

export type ClientGameState = ClientEntreExtremosGameState | ClientFourColorsGameState;

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
