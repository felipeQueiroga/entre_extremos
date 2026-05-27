const PLAYER_ID_KEY = "entre-extremos:playerId";
const PLAYER_NAME_KEY = "entre-extremos:playerName";
const ROOM_CODE_KEY = "entre-extremos:roomCode";

function readItem(key: string): string | null {
  const fromLocal = localStorage.getItem(key);
  if (fromLocal) return fromLocal;
  const fromSession = sessionStorage.getItem(key);
  if (!fromSession) return null;
  localStorage.setItem(key, fromSession);
  return fromSession;
}

export function saveSession(playerId: string, name: string, code: string): void {
  const normalizedCode = code.toUpperCase();
  localStorage.setItem(PLAYER_ID_KEY, playerId);
  localStorage.setItem(PLAYER_NAME_KEY, name);
  localStorage.setItem(ROOM_CODE_KEY, normalizedCode);
  sessionStorage.removeItem(PLAYER_ID_KEY);
  sessionStorage.removeItem(PLAYER_NAME_KEY);
  sessionStorage.removeItem(ROOM_CODE_KEY);
}

export function getStoredPlayerId(): string | null {
  return readItem(PLAYER_ID_KEY);
}

export function getStoredPlayerName(): string | null {
  return readItem(PLAYER_NAME_KEY);
}

export function getStoredRoomCode(): string | null {
  return readItem(ROOM_CODE_KEY);
}

export function hasStoredSession(code?: string): boolean {
  const playerId = getStoredPlayerId();
  const roomCode = getStoredRoomCode();
  if (!playerId || !roomCode) return false;
  if (!code) return true;
  return roomCode === code.toUpperCase();
}

export function clearSession(): void {
  localStorage.removeItem(PLAYER_ID_KEY);
  localStorage.removeItem(PLAYER_NAME_KEY);
  localStorage.removeItem(ROOM_CODE_KEY);
  sessionStorage.removeItem(PLAYER_ID_KEY);
  sessionStorage.removeItem(PLAYER_NAME_KEY);
  sessionStorage.removeItem(ROOM_CODE_KEY);
}

export function getStoredName(): string {
  return getStoredPlayerName() ?? "";
}
