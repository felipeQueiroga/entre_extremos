import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ClientRoomState } from "@entre-extremos/shared";
import { useGame } from "../../hooks/GameContext";
import { isHost } from "../../hooks/useGameHelpers";
import PokerActions from "./PokerActions";
import PokerHandSummary from "./PokerHandSummary";
import PokerTable from "./PokerTable";
import { isPokerTimerActive, POKER_TURN_SECONDS } from "./usePokerTableEffects";

interface PokerGameProps {
  state: ClientRoomState;
}

export default function PokerGame({ state }: PokerGameProps) {
  const navigate = useNavigate();
  const {
    pokerFold,
    pokerCheck,
    pokerCall,
    pokerBet,
    pokerRaise,
    pokerAllIn,
    pokerNextHand,
    restartGame,
  } = useGame();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const game = state.gameState?.kind === "poker" ? state.gameState : undefined;

  if (!game) {
    const inLobby = state.status === "lobby";
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Poker Texas Hold'em</p>
        <h2 className="mt-2 text-3xl font-black">
          {inLobby ? "Aguardando no lobby" : "Preparando a mesa"}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          {inLobby
            ? "O host voltou ao lobby. Aguarde ele iniciar uma nova partida."
            : "Distribuindo fichas e cartas. A mesa deve aparecer em instantes."}
        </p>
      </section>
    );
  }

  const currentName = game.players.find((player) => player.playerId === game.currentPlayerId)?.name;
  const showTimer = isPokerTimerActive(game);
  const secondsLeft = showTimer && game.turnDeadlineAt
    ? Math.max(0, Math.ceil((game.turnDeadlineAt - now) / 1000))
    : undefined;
  const timerIsUrgent = secondsLeft !== undefined && secondsLeft <= 5;
  const isLocalTurn = game.currentPlayerId === state.playerId;

  return (
    <div className="space-y-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
              Mão #{game.handNumber}
            </p>
            <h2 className="text-xl font-black sm:text-2xl">Poker Texas Hold'em</h2>
          </div>
          <div className="min-w-[10rem] text-right text-xs text-slate-300 sm:text-sm">
            <p>Jogador da vez: {currentName ?? "aguardando"}</p>
            <p>
              Blinds {state.pokerOptions.smallBlind}/{state.pokerOptions.bigBlind}
            </p>
            {secondsLeft !== undefined && (
              <div className="mt-2 text-left sm:text-right">
                <p className={`font-black ${timerIsUrgent ? "text-rose-300" : "text-emerald-300"}`}>
                  {secondsLeft}s para agir
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      timerIsUrgent ? "bg-rose-400" : "bg-emerald-400"
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, (secondsLeft / POKER_TURN_SECONDS) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Placar
          </span>
          {state.players.map((player) => (
            <span
              key={player.id}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                player.id === state.playerId
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-200"
              }`}
            >
              {player.name}: {state.score[player.id] ?? 0}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_230px]">
        <PokerTable game={game} localPlayerId={state.playerId} />

        <div className="space-y-2">
          {game.isGameOver && (
            <section className="rounded-xl border border-amber-400/40 bg-amber-950/50 p-3 text-sm text-amber-50">
              <p className="font-black uppercase tracking-[0.15em]">Mesa encerrada</p>
              <p className="mt-1 text-xs text-amber-100">
                Um jogador ficou sem fichas. O ponto já foi marcado no placar.
              </p>
            </section>
          )}

          {game.phase === "hand-ended" && !game.isGameOver && isHost(state) && (
            <button
              type="button"
              onClick={pokerNextHand}
              className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold hover:bg-emerald-500"
            >
              Próxima mão
            </button>
          )}

          <PokerActions
            game={game}
            localPlayerId={state.playerId}
            secondsLeft={isLocalTurn ? secondsLeft : undefined}
            timerIsUrgent={isLocalTurn && timerIsUrgent}
            onFold={pokerFold}
            onCheck={pokerCheck}
            onCall={pokerCall}
            onBet={pokerBet}
            onRaise={pokerRaise}
            onAllIn={pokerAllIn}
          />

          <PokerHandSummary game={game} />

          {isHost(state) && (
            <button
              type="button"
              onClick={() => {
                restartGame();
                navigate(`/lobby/${state.code}`);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-900"
            >
              Voltar ao lobby
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
