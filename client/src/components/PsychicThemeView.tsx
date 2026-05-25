import { useState } from "react";

interface PsychicThemeViewProps {
  onSubmit: (left: string, right: string) => void;
}

export default function PsychicThemeView({ onSubmit }: PsychicThemeViewProps) {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  return (
    <div className="space-y-6 rounded-2xl border border-violet-500/30 bg-violet-950/20 p-6">
      <h2 className="text-xl font-semibold text-violet-200">Defina o tema da rodada</h2>
      <p className="text-slate-300">
        Escolha os dois extremos opostos da escala. Os outros jogadores só verão o tema depois de
        confirmar.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="extreme-left" className="mb-2 block text-sm text-slate-400">
            Extremo esquerdo
          </label>
          <input
            id="extreme-left"
            type="text"
            maxLength={30}
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Ex.: Frio"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3"
          />
        </div>
        <div>
          <label htmlFor="extreme-right" className="mb-2 block text-sm text-slate-400">
            Extremo direito
          </label>
          <input
            id="extreme-right"
            type="text"
            maxLength={30}
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Ex.: Quente"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSubmit(left.trim(), right.trim())}
        disabled={left.trim().length < 2 || right.trim().length < 2}
        className="w-full rounded-lg bg-violet-600 py-3 font-semibold hover:bg-violet-500 disabled:opacity-40"
      >
        Confirmar tema
      </button>
    </div>
  );
}
