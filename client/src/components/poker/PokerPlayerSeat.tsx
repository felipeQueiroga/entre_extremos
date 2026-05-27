import type { PokerVisiblePlayer } from "@entre-extremos/shared";
import PokerCard from "./PokerCard";

interface PokerPlayerSeatProps {
  player: PokerVisiblePlayer;
  isCurrent: boolean;
  isDealer: boolean;
  isWinner: boolean;
}

export default function PokerPlayerSeat({ player, isCurrent, isDealer, isWinner }: PokerPlayerSeatProps) {
  return (
    <div
      className={`rounded-2xl border p-3 shadow-lg transition ${
        isCurrent
          ? "border-amber-300 bg-amber-950/70 shadow-amber-950/40"
          : isWinner
            ? "border-emerald-300 bg-emerald-950/60"
            : "border-slate-700 bg-slate-950/80"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-100">{player.name}</p>
          <p className="text-xs text-slate-400">
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
        {isDealer && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-950">D</span>
        )}
      </div>

      <div className="mb-2 flex min-h-16 justify-center -space-x-4">
        {(player.cards ?? [undefined, undefined]).slice(0, 2).map((card, index) => (
          <PokerCard key={card?.id ?? index} card={card} hidden={!card} compact />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="rounded-lg bg-slate-900 px-2 py-1 text-slate-300">Fichas: {player.chips}</span>
        <span className="rounded-lg bg-slate-900 px-2 py-1 text-slate-300">Aposta: {player.currentBet}</span>
      </div>
    </div>
  );
}
