import type { Card as FourColorsCard } from "@entre-extremos/shared";
import Card from "./Card";

interface PlayerHandProps {
  cards: FourColorsCard[];
  playableCardIds: Set<string>;
  isTurn: boolean;
  onPlayCard: (cardId: string) => void;
}

export default function PlayerHand({
  cards,
  playableCardIds,
  isTurn,
  onPlayCard,
}: PlayerHandProps) {
  return (
    <section className="four-colors-hand flex min-w-0 flex-col rounded-[1.5rem] border border-slate-700 bg-slate-950/80 p-3 shadow-2xl sm:rounded-[2rem] sm:p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h2 className="text-lg font-semibold">Sua mão</h2>
        <span className="text-sm text-slate-400">{cards.length} carta(s)</span>
      </div>
      <div className="four-colors-hand-scroll flex flex-wrap justify-center gap-2 pb-1 pt-3">
        {cards.map((card) => {
          const playable = isTurn && playableCardIds.has(card.id);
          return (
            <Card
              key={card.id}
              card={card}
              size="hand"
              playable={playable}
              disabled={!playable}
              onClick={() => onPlayCard(card.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
