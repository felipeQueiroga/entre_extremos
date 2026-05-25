import type {
  CardSource,
  CardTheme,
  ChatMessage,
  ClientRoomState,
  Direction,
  GameMode,
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
} as const;

export interface RoomCreatePayload {
  name: string;
  mode?: GameMode;
  cardSource?: CardSource;
  cardThemes?: CardTheme[];
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

export interface RoomErrorPayload {
  message: string;
}

export interface GameOverPayload {
  winners: string[];
  state: ClientRoomState;
}

export type { ChatMessage };
