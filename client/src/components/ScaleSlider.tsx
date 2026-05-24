interface ScaleSliderProps {
  value: number;
  onChange?: (value: number) => void;
  targetPosition?: number;
  guessPosition?: number;
  disabled?: boolean;
  showTarget?: boolean;
  showGuess?: boolean;
  leftLabel: string;
  rightLabel: string;
}

export default function ScaleSlider({
  value,
  onChange,
  targetPosition,
  guessPosition,
  disabled = false,
  showTarget = false,
  showGuess = false,
  leftLabel,
  rightLabel,
}: ScaleSliderProps) {
  const markers = [
    showTarget && targetPosition !== undefined
      ? { pos: targetPosition, color: "bg-emerald-400", label: "Alvo" }
      : null,
    showGuess && guessPosition !== undefined
      ? { pos: guessPosition, color: "bg-sky-400", label: "Palpite" }
      : null,
    !showGuess && !disabled
      ? { pos: value, color: "bg-indigo-400", label: "Ponteiro" }
      : null,
  ].filter(Boolean) as { pos: number; color: string; label: string }[];

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm font-medium text-slate-300">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>

      <div className="relative pt-8 pb-2">
        <div className="h-2 rounded-full bg-slate-700" />
        {markers.map((marker) => (
          <div
            key={marker.label}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${marker.pos}%` }}
          >
            <span className="mb-1 text-xs text-slate-400">{marker.label}</span>
            <span className={`h-4 w-4 rounded-full ${marker.color} ring-2 ring-slate-950`} />
          </div>
        ))}
      </div>

      {!disabled && onChange && (
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
      )}
    </div>
  );
}
