import type { CSSProperties } from "react";
import type { ClientPokerGameState } from "@entre-extremos/shared";
import PokerCard from "./PokerCard";
import PokerPlayerSeat from "./PokerPlayerSeat";

interface PokerTableProps {
  game: ClientPokerGameState;
  localPlayerId: string;
}

const PHASE_LABEL = {
  waiting: "Aguardando",
  preflop: "Pre-flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
  showdown: "Showdown",
  "hand-ended": "Mão encerrada",
} as const;

function rotatePlayersToLocalBottom(game: ClientPokerGameState, localPlayerId: string) {
  const localIndex = game.players.findIndex((player) => player.playerId === localPlayerId);
  if (localIndex < 0) return game.players;
  return [...game.players.slice(localIndex), ...game.players.slice(0, localIndex)];
}

function seatPosition(index: number, total: number): CSSProperties {
  if (total <= 1) {
    return { left: "50%", top: "82%", transform: "translate(-50%, -50%)" };
  }

  const angle = 90 + (360 / total) * index;
  const radians = (angle * Math.PI) / 180;
  const x = 50 + Math.cos(radians) * 34;
  const y = 50 + Math.sin(radians) * 35;

  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
  };
}

export default function PokerTable({ game, localPlayerId }: PokerTableProps) {
  const tablePlayers = rotatePlayersToLocalBottom(game, localPlayerId);
  const winnerResults =
    game.handResults?.filter((result) => game.winners?.includes(result.playerId)) ?? [];
  const winningCardIds = new Set(winnerResults.flatMap((result) => result.cards.map((card) => card.id)));
  const winningHandLabels = [...new Set(winnerResults.map((result) => result.label))].filter(
    (label) => label !== "Venceu por desistência"
  );

  return (
    <section className="relative rounded-[1.5rem] border border-emerald-400/30 bg-[radial-gradient(circle_at_center,#17824b,#075f39_48%,#063320_78%)] p-3 shadow-2xl shadow-emerald-950/60 sm:p-4">
      <div className="absolute inset-2 rounded-[1.15rem] border-4 border-amber-900/60" />
      {tablePlayers.map((player, visualIndex) => {
        const realIndex = game.players.findIndex((item) => item.playerId === player.playerId);
        return (
          <div
            key={player.playerId}
            className="absolute z-20 w-32 max-w-[38vw] sm:w-36 md:w-40"
            style={seatPosition(visualIndex, tablePlayers.length)}
          >
            <PokerPlayerSeat
              player={player}
              isCurrent={player.playerId === game.currentPlayerId}
              isDealer={realIndex === game.dealerIndex}
              isLocal={player.playerId === localPlayerId}
              isWinner={(game.winners ?? []).includes(player.playerId)}
              winningCardIds={winningCardIds}
            />
          </div>
        );
      })}

      <div className="relative z-10 flex min-h-[22rem] flex-col items-center justify-center gap-3 px-20 py-20 sm:min-h-[24rem] sm:px-24">
        <div className="rounded-full border border-amber-200/30 bg-slate-950/60 px-4 py-1.5 text-center shadow-lg">
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-amber-200">Pote</p>
          <p className="text-2xl font-black text-amber-100">{game.pot}</p>
        </div>

        <div className="flex min-h-20 flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <PokerCard
              key={index}
              card={game.communityCards[index]}
              hidden={!game.communityCards[index]}
              highlighted={
                !!game.communityCards[index] && winningCardIds.has(game.communityCards[index].id)
              }
            />
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-100">
            {PHASE_LABEL[game.phase]}
          </p>
          {winningHandLabels.length > 0 && (
            <p className="mt-1 rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-950">
              Mão vencedora: {winningHandLabels.join(" / ")}
            </p>
          )}
          {game.lastAction && <p className="mt-1 text-xs text-emerald-50/80">{game.lastAction}</p>}
        </div>
      </div>
    </section>
  );
}
