import type {
  CardSource,
  CardTheme,
  CardColor,
  ChatMessage,
  ClientRoomState,
  Direction,
  FourColorsOptions,
  GameMode,
  SelectedGame,
} from "./types";

export const SERVER_EVENTS = {
  ROOM_ERROR: "room:error",
  GAME_STATE: "game:state",
  GAME_OVER: "game:over",
  CHAT_MESSAGE: "chat:message",
  CHAT_HISTORY: "chat:history",
} as const;

export const CLIENT_EVENTS = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_RECONNECT: "room:reconnect",
  PLAYER_SET_NAME: "player:set-name",
  PLAYER_JOIN_TEAM: "player:join-team",
  GAME_START: "game:start",
  PSYCHIC_SUBMIT_THEME: "psychic:submit-theme",
  PSYCHIC_SUBMIT_CLUE: "psychic:submit-clue",
  PLAYER_SUBMIT_GUESS: "player:submit-guess",
  OPPONENT_SUBMIT_DIRECTION: "opponent:submit-direction",
  ROUND_NEXT: "round:next",
  GAME_RESTART: "game:restart",
  CHAT_SEND: "chat:send",
  FOUR_COLORS_START: "fourColors:start",
  FOUR_COLORS_PLAY_CARD: "fourColors:playCard",
  FOUR_COLORS_DRAW_CARD: "fourColors:drawCard",
  FOUR_COLORS_CHOOSE_COLOR: "fourColors:chooseColor",
  FOUR_COLORS_CALL_ONE: "fourColors:callOne",
  FOUR_COLORS_CHALLENGE_ONE: "fourColors:challengeOne",
  FOUR_COLORS_PASS_TURN: "fourColors:passTurn",
  FOUR_COLORS_CHOOSE_HAND_SWAP_TARGET: "fourColors:chooseHandSwapTarget",
  FOUR_COLORS_RESTART: "fourColors:restart",
} as const;

export interface RoomCreatePayload {
  name: string;
  selectedGame?: SelectedGame;
  mode?: GameMode;
  cardSource?: CardSource;
  cardThemes?: CardTheme[];
  fourColorsOptions?: FourColorsOptions;
}

export interface RoomJoinPayload {
  code: string;
  name: string;
  playerId?: string;
}

export interface RoomReconnectPayload {
  code: string;
  playerId: string;
}

export interface PlayerJoinTeamPayload {
  team: "A" | "B";
}

export interface PsychicSubmitThemePayload {
  left: string;
  right: string;
}

export interface PsychicSubmitCluePayload {
  clue: string;
}

export interface PlayerSubmitGuessPayload {
  position: number;
}

export interface OpponentSubmitDirectionPayload {
  direction: Direction;
}

export interface ChatSendPayload {
  text: string;
}

export interface FourColorsPlayCardPayload {
  cardId: string;
}

export interface FourColorsChooseColorPayload {
  color: CardColor;
}

export interface FourColorsChallengeOnePayload {
  targetPlayerId: string;
}

export interface FourColorsChooseHandSwapTargetPayload {
  targetPlayerId?: string;
}

export interface RoomErrorPayload {
  message: string;
}

export interface GameOverPayload {
  winners: string[];
  state: ClientRoomState;
}

export type { ChatMessage };
