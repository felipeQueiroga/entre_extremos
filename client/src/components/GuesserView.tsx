import { useState } from "react";
import GameDial from "./GameDial";

interface GuesserViewProps {
  clue: string;
  leftLabel: string;
  rightLabel: string;
  onSubmit: (position: number) => void;
}

export default function GuesserView({ clue, leftLabel, rightLabel, onSubmit }: GuesserViewProps) {
  const [position, setPosition] = useState(50);

  return (
    <div className="space-y-6 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-6">
      <h2 className="text-xl font-semibold text-sky-200">Hora de palpitar</h2>
      <p className="rounded-lg bg-slate-900 px-4 py-3 text-lg">
        Dica: <span className="font-semibold text-white">{clue}</span>
      </p>
      <p className="text-sm text-slate-400">
        Arraste o ponteiro no mostrador até onde acha que o alvo está entre os dois extremos.
      </p>

      <GameDial
        mode="guess"
        pointerValue={position}
        revealed={false}
        onChange={setPosition}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
      />

      <button
        type="button"
        onClick={() => onSubmit(position)}
        className="w-full rounded-lg bg-sky-600 py-3 font-semibold hover:bg-sky-500"
      >
        Confirmar palpite
      </button>
    </div>
  );
}
