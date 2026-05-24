interface OpponentDirectionViewProps {
  guessPosition: number;
  leftLabel: string;
  rightLabel: string;
  onSubmit: (direction: "left" | "right") => void;
}

export default function OpponentDirectionView({
  guessPosition,
  leftLabel,
  rightLabel,
  onSubmit,
}: OpponentDirectionViewProps) {
  return (
    <div className="space-y-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
      <h2 className="text-xl font-semibold text-amber-200">Aposta adversária</h2>
      <p className="text-slate-300">
        O time adversário posicionou o ponteiro em <strong>{guessPosition}</strong>.
        O alvo está à esquerda ou à direita do ponteiro?
      </p>

      <div className="flex justify-between text-sm text-slate-400">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSubmit("left")}
          className="rounded-lg bg-slate-800 py-4 font-semibold hover:bg-slate-700"
        >
          ← Esquerda
        </button>
        <button
          type="button"
          onClick={() => onSubmit("right")}
          className="rounded-lg bg-slate-800 py-4 font-semibold hover:bg-slate-700"
        >
          Direita →
        </button>
      </div>
    </div>
  );
}
