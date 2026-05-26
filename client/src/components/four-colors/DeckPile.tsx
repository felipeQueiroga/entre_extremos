import { CardBack } from "./Card";

interface DeckPileProps {
  disabled?: boolean;
  canPass?: boolean;
  passHint?: string;
  onDraw: () => void;
  onPass: () => void;
}

export default function DeckPile({ disabled, canPass, passHint, onDraw, onPass }: DeckPileProps) {
  return (
    <div className="text-center">
      <button
        type="button"
        onClick={onDraw}
        disabled={disabled}
        className="group relative mx-auto block disabled:opacity-50"
        aria-label="Comprar carta"
      >
        <CardBack className="transition group-hover:-translate-y-1" />
      </button>
      <button
        type="button"
        onClick={onDraw}
        disabled={disabled}
        className="mt-3 w-full rounded-full bg-sky-600 px-5 py-2 text-sm font-bold hover:bg-sky-500 disabled:opacity-40"
      >
        Comprar
      </button>
      <button
        type="button"
        onClick={onPass}
        disabled={!canPass}
        className="mt-2 w-full rounded-full bg-slate-700 px-5 py-2 text-sm font-semibold hover:bg-slate-600 disabled:opacity-40"
      >
        Passar
      </button>
      {passHint && <p className="mt-2 max-w-32 text-xs text-amber-200">{passHint}</p>}
    </div>
  );
}
