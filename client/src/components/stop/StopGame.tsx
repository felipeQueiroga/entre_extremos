import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CardTheme, ClientRoomState } from "@entre-extremos/shared";
import { useGame } from "../../hooks/GameContext";
import { isHost } from "../../hooks/useGameHelpers";
import ScoreBoard from "../ScoreBoard";
import StopFillGrid from "./StopFillGrid";
import StopRoundSummary from "./StopRoundSummary";
import StopValidation from "./StopValidation";

interface StopGameProps {
  state: ClientRoomState;
}

export default function StopGame({ state }: StopGameProps) {
  const navigate = useNavigate();
  const { stopSubmitAnswers, stopCallStop, stopVote, stopNextRound, restartGame } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const debounceRef = useRef<number | null>(null);

  const game = state.gameState?.kind === "stop" ? state.gameState : undefined;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const flushAnswers = useCallback(
    (answers: Record<string, string>) => {
      stopSubmitAnswers(answers);
    },
    [stopSubmitAnswers]
  );

  const handleChange = useCallback(
    (categoryId: CardTheme, value: string) => {
      if (!game || game.phase !== "filling") return;
      const next = { ...game.myAnswers, [categoryId]: value };
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => flushAnswers(next), 400);
    },
    [game, flushAnswers]
  );

  const handleStop = useCallback(() => {
    if (!game) return;
    flushAnswers(game.myAnswers);
    stopCallStop();
  }, [game, flushAnswers, stopCallStop]);

  if (!game) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-violet-300">Stop</p>
        <h2 className="mt-2 text-3xl font-black">Preparando a rodada</h2>
      </section>
    );
  }

  const secondsLeft = game.turnDeadlineAt
    ? Math.max(0, Math.ceil((game.turnDeadlineAt - now) / 1000))
    : undefined;
  const timerUrgent = secondsLeft !== undefined && secondsLeft <= 10;

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-violet-300">
              Rodada {game.roundNumber}/{game.totalRounds}
            </p>
            <h2 className="text-2xl font-black">Stop</h2>
          </div>
          {secondsLeft !== undefined && game.phase !== "round-ended" && game.phase !== "game-over" && (
            <div className="text-right">
              <p className={`text-lg font-black ${timerUrgent ? "text-rose-300" : "text-violet-200"}`}>
                {secondsLeft}s
              </p>
              <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full ${timerUrgent ? "bg-rose-400" : "bg-violet-400"}`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (secondsLeft /
                          (game.phase === "filling"
                            ? state.stopOptions.fillTimeMs / 1000
                            : state.stopOptions.validationTimeMs / 1000)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {game.lastAction && (
          <p className="mt-2 text-sm text-slate-400">{game.lastAction}</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <ScoreBoard state={state} />
      </section>

      {game.isGameOver && (
        <section className="rounded-xl border border-amber-400/40 bg-amber-950/50 p-4 text-center">
          <p className="text-lg font-black text-amber-100">Fim de jogo!</p>
          {isHost(state) && (
            <button
              type="button"
              onClick={() => {
                restartGame();
              }}
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold hover:bg-emerald-500"
            >
              Voltar ao lobby
            </button>
          )}
        </section>
      )}

      {game.phase === "filling" && (
        <StopFillGrid game={game} onChange={handleChange} onStop={handleStop} />
      )}

      {game.phase === "validation" && (
        <StopValidation
          game={game}
          localPlayerId={state.playerId}
          onVote={(categoryId, answerOwnerId, valid) =>
            stopVote(categoryId as CardTheme, answerOwnerId, valid)
          }
        />
      )}

      {(game.phase === "round-ended" || game.phase === "game-over") && (
        <StopRoundSummary game={game} playerNames={game.playerNames} />
      )}

      {game.phase === "round-ended" && !game.isGameOver && isHost(state) && (
        <button
          type="button"
          onClick={stopNextRound}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold hover:bg-emerald-500"
        >
          Próxima rodada
        </button>
      )}

      {isHost(state) && !game.isGameOver && (
        <button
          type="button"
          onClick={() => {
            restartGame();
            navigate(`/lobby/${state.code}`);
          }}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900"
        >
          Voltar ao lobby
        </button>
      )}
    </div>
  );
}
