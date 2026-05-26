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
    <div className="four-colors-discard text-center">
      <div
        className={`relative mx-auto h-32 w-24 rounded-[2rem] border-4 shadow-2xl transition sm:h-36 sm:w-24 lg:h-40 lg:w-28 ${COLOR_ACCENTS[currentColor]}`}
      >
        <div className="absolute left-2 top-3 h-28 w-20 rotate-6 rounded-3xl border-[5px] border-white bg-slate-700 opacity-50 shadow-xl sm:h-32 sm:w-20 lg:h-36 lg:w-24" />
        <div className="absolute left-1 top-2 h-28 w-20 -rotate-3 rounded-3xl border-[5px] border-white bg-slate-800 opacity-60 shadow-xl sm:h-32 sm:w-20 lg:h-36 lg:w-24" />
        <div className="absolute inset-0">
          <Card card={card} disabled size="responsive" />
        </div>
      </div>
      <p className="mt-2 rounded-full bg-slate-950/60 px-3 py-2 text-xs text-slate-200 sm:mt-4 sm:px-4 sm:text-sm">
        Cor atual: <strong>{COLOR_LABELS[currentColor]}</strong>
      </p>
    </div>
  );
}
