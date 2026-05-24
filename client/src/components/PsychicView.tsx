import { useState } from "react";
import ScaleSlider from "./ScaleSlider";

interface PsychicViewProps {
  targetPosition?: number;
  leftLabel: string;
  rightLabel: string;
  onSubmit: (clue: string) => void;
}

export default function PsychicView({
  targetPosition,
  leftLabel,
  rightLabel,
  onSubmit,
}: PsychicViewProps) {
  const [clue, setClue] = useState("");

  return (
    <div className="space-y-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6">
      <h2 className="text-xl font-semibold text-indigo-200">Você é o psíquico</h2>
      <p className="text-slate-300">
        Veja onde está o alvo na escala e dê uma dica para seu parceiro.
      </p>

      <ScaleSlider
        value={targetPosition ?? 50}
        targetPosition={targetPosition}
        showTarget
        disabled
        leftLabel={leftLabel}
        rightLabel={rightLabel}
      />

      <div className="space-y-2">
        <label htmlFor="clue" className="text-sm text-slate-400">
          Sua dica (uma palavra ou frase curta)
        </label>
        <input
          id="clue"
          type="text"
          maxLength={100}
          value={clue}
          onChange={(e) => setClue(e.target.value)}
          placeholder="Ex.: gelado, luxo, nostalgia..."
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          if (clue.trim()) onSubmit(clue.trim());
        }}
        disabled={!clue.trim()}
        className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-40"
      >
        Enviar dica
      </button>
    </div>
  );
}
