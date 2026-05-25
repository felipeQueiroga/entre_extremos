import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EntreExtremosGame from "../components/entre-extremos/EntreExtremosGame";
import FourColorsGame from "../components/four-colors/FourColorsGame";
import RoomChat from "../components/RoomChat";
import { useGame } from "../hooks/GameContext";
import { useRoomRedirect } from "../hooks/useGameHelpers";
import { getStoredPlayerId, getStoredPlayerName, getStoredRoomCode } from "../utils/session";

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    state,
    joinRoom,
    submitTheme,
    submitClue,
    submitGuess,
    submitDirection,
    nextRound,
    error,
    clearError,
  } = useGame();

  useRoomRedirect(code);

  useEffect(() => {
    if (state?.status === "finished") {
      navigate(`/game-over/${state.code}`, { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    async function reconnect() {
      if (state?.code === code?.toUpperCase()) return;
      const storedCode = getStoredRoomCode();
      const storedId = getStoredPlayerId();
      const storedName = getStoredPlayerName();
      if (storedCode === code?.toUpperCase() && storedId && storedName) {
        await joinRoom(code!, storedName, storedId);
      }
    }
    reconnect();
  }, [code, state, joinRoom]);

  if (!state || state.code !== code?.toUpperCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Carregando partida...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {error && (
            <p className="mb-4 rounded-lg bg-rose-900/40 px-4 py-2 text-center text-rose-200">
              {error}
              <button type="button" onClick={clearError} className="ml-2 underline">
                ok
              </button>
            </p>
          )}

          {state.selectedGame === "quatro-cores" ? (
            <FourColorsGame state={state} />
          ) : (
            <EntreExtremosGame
              state={state}
              submitTheme={submitTheme}
              submitClue={submitClue}
              submitGuess={submitGuess}
              submitDirection={submitDirection}
              nextRound={nextRound}
            />
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
          <RoomChat />
        </aside>
      </div>
    </div>
  );
}
