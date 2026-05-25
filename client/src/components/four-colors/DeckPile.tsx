interface DeckPileProps {
  deckCount: number;
  disabled?: boolean;
  canPass?: boolean;
  onDraw: () => void;
  onPass: () => void;
}

export default function DeckPile({ deckCount, disabled, canPass, onDraw, onPass }: DeckPileProps) {
  return (
    <div className="rounded-2xl bg-slate-900 p-4 text-center">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Compra
      </h2>
      <button
        type="button"
        onClick={onDraw}
        disabled={disabled}
        className="mx-auto flex h-28 w-20 items-center justify-center rounded-2xl border-2 border-slate-500 bg-slate-800 text-2xl font-bold shadow-lg hover:bg-slate-700 disabled:opacity-50"
      >
        {deckCount}
      </button>
      <button
        type="button"
        onClick={onPass}
        disabled={!canPass}
        className="mt-3 w-full rounded-lg bg-slate-700 py-2 text-sm font-semibold hover:bg-slate-600 disabled:opacity-40"
      >
        Passar
      </button>
    </div>
  );
}
