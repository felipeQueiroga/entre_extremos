const PLAYER_ID_KEY = "entre-extremos:playerId";
const PLAYER_NAME_KEY = "entre-extremos:playerName";
const ROOM_CODE_KEY = "entre-extremos:roomCode";

export function saveSession(playerId: string, name: string, code: string): void {
  sessionStorage.setItem(PLAYER_ID_KEY, playerId);
  sessionStorage.setItem(PLAYER_NAME_KEY, name);
  sessionStorage.setItem(ROOM_CODE_KEY, code);
}

export function getStoredPlayerId(): string | null {
  return sessionStorage.getItem(PLAYER_ID_KEY);
}

export function getStoredPlayerName(): string | null {
  return sessionStorage.getItem(PLAYER_NAME_KEY);
}

export function getStoredRoomCode(): string | null {
  return sessionStorage.getItem(ROOM_CODE_KEY);
}

export function clearSession(): void {
  sessionStorage.removeItem(PLAYER_ID_KEY);
  sessionStorage.removeItem(PLAYER_NAME_KEY);
  sessionStorage.removeItem(ROOM_CODE_KEY);
}

export function getStoredName(): string {
  return getStoredPlayerName() ?? "";
}
