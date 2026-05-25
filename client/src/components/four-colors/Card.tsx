import type { Card as FourColorsCard, CardColor } from "@entre-extremos/shared";

interface CardProps {
  card: FourColorsCard;
  playable?: boolean;
  disabled?: boolean;
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
  if (card.type === "skip") return "Pula";
  if (card.type === "reverse") return "Vira";
  if (card.type === "draw2") return "+2";
  if (card.type === "wild") return "Coringa";
  return "+4";
}

export default function Card({ card, playable = false, disabled = false, onClick }: CardProps) {
  const colorClass = card.color
    ? COLOR_CLASSES[card.color]
    : "bg-gradient-to-br from-rose-600 via-amber-400 to-sky-600 border-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative h-28 w-20 shrink-0 rounded-2xl border-2 p-2 text-left font-bold shadow-lg transition ${
        colorClass
      } ${playable ? "translate-y-[-6px] ring-2 ring-white" : ""} ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:translate-y-[-6px]"
      }`}
    >
      <span className="text-xs uppercase tracking-wide opacity-80">
        {card.color ?? "todas"}
      </span>
      <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center text-xl">
        {cardLabel(card)}
      </span>
    </button>
  );
}
