export type GameMode = "couple" | "teams";

export type CardSource = "deck" | "free";

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

export interface Card {
  id: string;
  left: string;
  right: string;
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
  card: Card;
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

export interface RoomState {
  code: string;
  players: Player[];
  score: Record<string, number>;
  teamScore?: TeamScore;
  status: RoomStatus;
  mode: GameMode;
  cardSource: CardSource;
  cardThemes: CardTheme[];
  messages: ChatMessage[];
  currentRound?: RoundState;
  winningScore: number;
  usedCardIds: string[];
}

export interface ClientRoundState extends Omit<RoundState, "targetPosition"> {
  targetPosition?: number;
}

export interface ClientRoomState extends Omit<RoomState, "currentRound" | "usedCardIds"> {
  currentRound?: ClientRoundState;
  playerId: string;
}

export interface RoundResult {
  distance: number;
  guesserPoints: number;
  opponentPoints: number;
  guesserId: string;
}
