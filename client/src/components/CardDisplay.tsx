import type { Card } from "@entre-extremos/shared";

interface CardDisplayProps {
  card: Card;
}

export default function CardDisplay({ card }: CardDisplayProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-800/80 px-6 py-4">
      <span className="text-lg font-semibold text-sky-300">{card.left}</span>
      <span className="text-sm text-slate-500">↔</span>
      <span className="text-lg font-semibold text-rose-300">{card.right}</span>
    </div>
  );
}
