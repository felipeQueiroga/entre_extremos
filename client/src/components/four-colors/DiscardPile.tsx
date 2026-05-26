import type { CardColor, Card as FourColorsCard } from "@entre-extremos/shared";
import Card from "./Card";

interface DiscardPileProps {
  card: FourColorsCard;
  currentColor: CardColor;
}

const COLOR_LABELS: Record<CardColor, string> = {
  red: "Vermelho",
  blue: "Azul",
  green: "Verde",
  yellow: "Amarelo",
};

const COLOR_ACCENTS: Record<CardColor, string> = {
  red: "border-rose-300 bg-rose-950/50 shadow-rose-900/40",
  blue: "border-sky-300 bg-sky-950/50 shadow-sky-900/40",
  green: "border-emerald-300 bg-emerald-950/50 shadow-emerald-900/40",
  yellow: "border-amber-200 bg-amber-950/50 shadow-amber-900/40",
};

export default function DiscardPile({ card, currentColor }: DiscardPileProps) {
  return (
    <div className="text-center">
      <div
        className={`relative mx-auto h-40 w-28 rounded-[2rem] border-4 shadow-2xl transition ${COLOR_ACCENTS[currentColor]}`}
      >
        <div className="absolute left-2 top-3 h-36 w-24 rotate-6 rounded-3xl border-[5px] border-white bg-slate-700 opacity-50 shadow-xl" />
        <div className="absolute left-1 top-2 h-36 w-24 -rotate-3 rounded-3xl border-[5px] border-white bg-slate-800 opacity-60 shadow-xl" />
        <div className="absolute inset-0">
          <Card card={card} disabled size="lg" />
        </div>
      </div>
      <p className="mt-4 rounded-full bg-slate-950/60 px-4 py-2 text-sm text-slate-200">
        Cor atual: <strong>{COLOR_LABELS[currentColor]}</strong>
      </p>
    </div>
  );
}
