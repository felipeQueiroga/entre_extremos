export type GameMode = "couple" | "teams";

export type RoomStatus = "lobby" | "playing" | "finished";

export type RoundPhase = "psychic_clue" | "guess" | "opponent_direction" | "reveal" | "ended";

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
