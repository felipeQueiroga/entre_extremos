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

export default function DiscardPile({ card, currentColor }: DiscardPileProps) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4 text-center">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Descarte
      </h2>
      <div className="flex justify-center">
        <Card card={card} disabled />
      </div>
      <p className="mt-3 text-sm text-slate-300">
        Cor atual: <strong>{COLOR_LABELS[currentColor]}</strong>
      </p>
    </div>
  );
}
