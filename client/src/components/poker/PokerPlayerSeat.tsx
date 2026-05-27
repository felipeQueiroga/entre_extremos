import type { PokerVisiblePlayer } from "@entre-extremos/shared";
import PokerCard from "./PokerCard";

interface PokerPlayerSeatProps {
  player: PokerVisiblePlayer;
  isCurrent: boolean;
  isDealer: boolean;
  isLocal: boolean;
  isWinner: boolean;
  winningCardIds: Set<string>;
  animateAllIn?: boolean;
  animateTurn?: boolean;
}

export default function PokerPlayerSeat({
  player,
  isCurrent,
  isDealer,
  isLocal,
  isWinner,
  winningCardIds,
  animateAllIn = false,
  animateTurn = false,
}: PokerPlayerSeatProps) {
  return (
    <div
      className={`rounded-lg border p-1.5 shadow-lg transition ${
        isCurrent
          ? "border-amber-300 bg-amber-950/70 shadow-amber-950/40"
          : isWinner
            ? "border-emerald-300 bg-emerald-950/60"
            : "border-slate-700 bg-slate-950/80"
      } ${animateAllIn ? "poker-all-in-flash" : ""} ${animateTurn ? "poker-turn-pulse" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold leading-tight text-slate-100">{player.name}</p>
          <p className="truncate text-[0.65rem] leading-tight text-slate-400">
            {player.status === "folded"
              ? "Desistiu"
              : player.status === "all-in"
                ? "All-in"
                : player.status === "out"
                  ? "Sem fichas"
                  : isCurrent
                    ? "Jogando agora"
                    : "Na mão"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isLocal && (
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-emerald-200">
              Você
            </span>
          )}
          {isDealer && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-black text-slate-950">D</span>
          )}
        </div>
      </div>

      <div className="mb-1 flex min-h-8 justify-center -space-x-3">
        {(player.cards ?? [undefined, undefined]).slice(0, 2).map((card, index) => (
          <PokerCard
            key={card?.id ?? index}
            card={card}
            hidden={!card}
            compact
            highlighted={!!card && winningCardIds.has(card.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1 text-[0.62rem]">
        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-300">F: {player.chips}</span>
        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-300">A: {player.currentBet}</span>
      </div>
    </div>
  );
}
