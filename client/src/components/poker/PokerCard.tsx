import type { PokerCard as PokerCardType } from "@entre-extremos/shared";

const SUIT_SYMBOL = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
} as const;

const SUIT_COLOR = {
  clubs: "text-slate-950",
  spades: "text-slate-950",
  diamonds: "text-rose-600",
  hearts: "text-rose-600",
} as const;

interface PokerCardProps {
  card?: PokerCardType;
  hidden?: boolean;
  compact?: boolean;
  highlighted?: boolean;
  reveal?: boolean;
}

export default function PokerCard({
  card,
  hidden = false,
  compact = false,
  highlighted = false,
  reveal = false,
}: PokerCardProps) {
  const size = compact ? "h-10 w-7 text-[0.6rem]" : "h-20 w-14 text-base sm:h-24 sm:w-16";
  const symbolSize = compact ? "text-base" : "text-xl sm:text-2xl";

  if (hidden || !card) {
    return (
      <div
        className={`${size} rounded-lg border border-indigo-200/40 bg-gradient-to-br from-indigo-900 via-blue-800 to-slate-950 shadow-lg ring-2 ring-white/10`}
      >
        <div className="m-1 h-[calc(100%-0.5rem)] rounded-md border border-white/20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25),transparent_45%)]" />
      </div>
    );
  }

  return (
    <div
      className={`${size} flex flex-col justify-between rounded-lg bg-slate-50 p-1.5 font-black shadow-lg ring-1 ring-slate-950/20 ${
        highlighted ? "scale-105 ring-4 ring-amber-300 shadow-amber-300/50" : ""
      } ${reveal ? "poker-card-reveal" : ""}`}
    >
      <span className={`${SUIT_COLOR[card.suit]} leading-none`}>{card.rank}</span>
      <span className={`${SUIT_COLOR[card.suit]} self-center ${symbolSize} leading-none`}>
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className={`${SUIT_COLOR[card.suit]} rotate-180 self-end leading-none`}>{card.rank}</span>
    </div>
  );
}
