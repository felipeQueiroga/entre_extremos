import type { CardColor } from "@entre-extremos/shared";

interface ColorPickerModalProps {
  open: boolean;
  onChoose: (color: CardColor) => void;
}

const COLORS: Array<{ id: CardColor; label: string; className: string }> = [
  { id: "red", label: "Vermelho", className: "bg-rose-600" },
  { id: "blue", label: "Azul", className: "bg-sky-600" },
  { id: "green", label: "Verde", className: "bg-emerald-600" },
  { id: "yellow", label: "Amarelo", className: "bg-amber-400 text-slate-950" },
];

export default function ColorPickerModal({ open, onChoose }: ColorPickerModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-2 text-xl font-bold">Escolha a próxima cor</h2>
        <p className="mb-4 text-sm text-slate-400">
          Essa cor define quais cartas poderão ser jogadas agora.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onChoose(color.id)}
              className={`rounded-xl px-4 py-5 font-bold ${color.className}`}
            >
              {color.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
