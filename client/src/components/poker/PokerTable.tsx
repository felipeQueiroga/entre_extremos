import type { ClientPokerGameState } from "@entre-extremos/shared";
import PokerCard from "./PokerCard";

interface PokerTableProps {
  game: ClientPokerGameState;
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

export default function PokerTable({ game }: PokerTableProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-[radial-gradient(circle_at_center,#17824b,#075f39_48%,#063320_78%)] p-4 shadow-2xl shadow-emerald-950/60 sm:p-8">
      <div className="absolute inset-3 rounded-[1.5rem] border-4 border-amber-900/60" />
      <div className="relative z-10 flex min-h-[16rem] flex-col items-center justify-center gap-5">
        <div className="rounded-full border border-amber-200/30 bg-slate-950/60 px-5 py-2 text-center shadow-lg">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Pote</p>
          <p className="text-3xl font-black text-amber-100">{game.pot}</p>
        </div>

        <div className="flex min-h-28 flex-wrap items-center justify-center gap-2 sm:gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <PokerCard key={index} card={game.communityCards[index]} hidden={!game.communityCards[index]} />
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-100">
            {PHASE_LABEL[game.phase]}
          </p>
          {game.lastAction && <p className="mt-1 text-sm text-emerald-50/80">{game.lastAction}</p>}
        </div>
      </div>
    </section>
  );
}
