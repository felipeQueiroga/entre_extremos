import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ClientRoomState } from "@entre-extremos/shared";
import { useGame } from "./GameContext";
import { clearSession } from "../utils/session";

export function useRoomSessionRestore(code: string | undefined) {
  const { state, restoringSession, restoreSession } = useGame();

  useEffect(() => {
    if (!code) return;
    const normalizedCode = code.toUpperCase();
    if (state?.code === normalizedCode) return;
    void restoreSession(normalizedCode);
  }, [code, state?.code, restoreSession]);

  const isReady = !!state && !!code && state.code === code.toUpperCase();
  const isLoading = restoringSession || (!!code && !isReady);

  return { isReady, isLoading };
}

export function RoomSessionLoading({
  message = "Reconectando à sala...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-slate-400">{message}</p>
    </div>
  );
}

export function RoomSessionFailed({
  onGoHome,
}: {
  onGoHome: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-slate-300">Não foi possível reconectar à sala.</p>
      <button
        type="button"
        onClick={onGoHome}
        className="rounded-lg bg-slate-700 px-6 py-3 font-semibold hover:bg-slate-600"
      >
        Voltar ao início
      </button>
    </div>
  );
}

export function useRoomSessionFailureHandler(error: string | null, isLoading: boolean) {
  const navigate = useNavigate();
  const { clearError } = useGame();

  const reconnectFailed =
    !isLoading &&
    !!error &&
    (error.includes("reconectar") ||
      error.includes("Não foi possível entrar") ||
      error.includes("Sala não encontrada"));

  function goHome() {
    clearSession();
    clearError();
    navigate("/", { replace: true });
  }

  return { reconnectFailed, goHome };
}

export function roomPathForState(roomState: ClientRoomState): string {
  if (roomState.status === "playing") return `/game/${roomState.code}`;
  if (roomState.status === "finished") return `/game-over/${roomState.code}`;
  return `/lobby/${roomState.code}`;
}
