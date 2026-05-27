import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EntreExtremosGame from "../components/entre-extremos/EntreExtremosGame";
import FourColorsGame from "../components/four-colors/FourColorsGame";
import PokerGame from "../components/poker/PokerGame";
import RoomChat from "../components/RoomChat";
import ScoreBoard from "../components/ScoreBoard";
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

  const isFourColors = state.selectedGame === "quatro-cores";
  const isPoker = state.selectedGame === "texas-holdem";

  return (
    <div
      className={
        isFourColors || isPoker
          ? "four-colors-room mx-auto min-h-dvh max-w-6xl px-2 py-2 sm:px-4 sm:py-4 lg:min-h-screen lg:py-8"
          : "mx-auto min-h-screen max-w-6xl px-3 py-5 sm:px-4 sm:py-8"
      }
    >
      <div
        className={
          isFourColors || isPoker
            ? "four-colors-room-grid grid gap-2 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6"
            : "grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6"
        }
      >
        <div className={isFourColors || isPoker ? "four-colors-main min-h-0 min-w-0" : "min-w-0"}>
          {error && (
            <p className="mb-4 rounded-lg bg-rose-900/40 px-4 py-2 text-center text-rose-200">
              {error}
              <button type="button" onClick={clearError} className="ml-2 underline">
                ok
              </button>
            </p>
          )}

          {!isPoker && (
            <section className="four-colors-score mb-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Placar
                </h2>
                <span className="text-xs text-slate-500">Sala {state.code}</span>
              </div>
              <ScoreBoard state={state} />
            </section>
          )}

          {isPoker ? (
            <PokerGame state={state} />
          ) : isFourColors ? (
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

        <aside className="four-colors-chat min-h-0 min-w-0 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
          <RoomChat />
        </aside>
      </div>
    </div>
  );
}
