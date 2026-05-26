import type { Card as FourColorsCard, CardColor } from "@entre-extremos/shared";

interface CardProps {
  card: FourColorsCard;
  playable?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg" | "responsive";
  onClick?: () => void;
}

const COLOR_CLASSES: Record<CardColor, string> = {
  red: "bg-rose-600 border-rose-300",
  blue: "bg-sky-600 border-sky-300",
  green: "bg-emerald-600 border-emerald-300",
  yellow: "bg-amber-400 border-amber-100 text-slate-950",
};

function cardLabel(card: FourColorsCard): string {
  if (card.type === "number") return String(card.value);
  if (card.type === "skip") return "×";
  if (card.type === "reverse") return "↺";
  if (card.type === "draw2") return "+2";
  if (card.type === "wild") return "★";
  return "+4";
}

function cardName(card: FourColorsCard): string {
  if (card.type === "number") return String(card.value);
  if (card.type === "skip") return "Pular";
  if (card.type === "reverse") return "Inverter";
  if (card.type === "draw2") return "Comprar 2";
  if (card.type === "wild") return "Coringa";
  return "Comprar 4";
}

const SIZE_CLASSES = {
  sm: "h-20 w-14 rounded-xl text-base",
  md: "h-28 w-20 rounded-2xl text-2xl",
  lg: "h-36 w-24 rounded-3xl text-4xl",
  responsive: "h-28 w-20 rounded-2xl text-2xl sm:h-36 sm:w-24 sm:rounded-3xl sm:text-4xl",
};

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative h-20 w-14 shrink-0 rounded-xl border-2 border-white/80 bg-slate-950 shadow-lg ${className}`}
    >
      <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-rose-500 via-amber-400 to-sky-500" />
      <div className="absolute inset-3 rounded-md border border-white/70 bg-slate-900/80" />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
        EQC
      </span>
    </div>
  );
}

export default function Card({
  card,
  playable = false,
  disabled = false,
  size = "md",
  onClick,
}: CardProps) {
  const colorClass = card.color
    ? COLOR_CLASSES[card.color]
    : "bg-gradient-to-br from-rose-600 via-amber-400 to-sky-600 border-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative shrink-0 border-[5px] border-white p-2 text-left font-black shadow-xl transition ${
        SIZE_CLASSES[size]
      } ${
        colorClass
      } ${playable ? "translate-y-[-10px] ring-4 ring-emerald-300" : ""} ${
        disabled && onClick ? "cursor-not-allowed opacity-60" : "hover:translate-y-[-6px]"
      }`}
    >
      <span className="absolute left-2 top-2 text-xs uppercase tracking-wide opacity-80">
        {cardName(card)}
      </span>
      <span className="absolute inset-x-3 top-1/2 flex aspect-[1.15] -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-center text-slate-950 shadow-inner">
        {cardLabel(card)}
      </span>
      <span className="absolute bottom-2 right-2 rotate-180 text-xs uppercase tracking-wide opacity-80">
        {cardName(card)}
      </span>
    </button>
  );
}
