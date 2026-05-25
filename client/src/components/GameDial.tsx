import { useCallback, useId, useRef } from "react";
import {
  DIAL,
  DIAL_COLORS,
  arcBandPath,
  pointToValue,
  valueToPoint,
} from "../utils/dialMath";

export type GameDialMode = "psychic" | "guess" | "reveal";

export type GameDialProps = {
  pointerValue: number;
  targetValue?: number;
  revealed: boolean;
  mode?: GameDialMode;
  disabled?: boolean;
  onChange?: (value: number) => void;
  leftLabel?: string;
  rightLabel?: string;
};

const ZONE_WIDTHS = [
  { maxDistance: 12, color: DIAL_COLORS.zone2, points: 2 },
  { maxDistance: 8, color: DIAL_COLORS.zone3, points: 3 },
  { maxDistance: 4, color: DIAL_COLORS.zone4, points: 4 },
] as const;

const STARS: { x: number; y: number; r: number }[] = [
  { x: 155, y: 188, r: 1.2 },
  { x: 178, y: 195, r: 0.9 },
  { x: 220, y: 198, r: 1.1 },
  { x: 245, y: 190, r: 0.8 },
  { x: 130, y: 200, r: 0.7 },
  { x: 265, y: 185, r: 1 },
  { x: 200, y: 202, r: 1.3 },
];

function ScoreZones({ target }: { target: number }) {
  return (
    <g className="game-dial-zones" aria-hidden>
      {ZONE_WIDTHS.map((zone) => {
        const start = target - zone.maxDistance;
        const end = target + zone.maxDistance;
        const d = arcBandPath(start, end, DIAL.BAND_OUTER - 6, DIAL.BAND_INNER);
        if (!d) return null;
        return (
          <path
            key={zone.points}
            d={d}
            fill={zone.color}
            fillOpacity={0.92}
            stroke={DIAL_COLORS.rim}
            strokeWidth={0.6}
          />
        );
      })}
    </g>
  );
}

function GuessPointer({ value }: { value: number }) {
  const tip = valueToPoint(value);
  const dx = tip.x - DIAL.CX;
  const dy = tip.y - DIAL.CY;
  const len = Math.hypot(dx, dy) || 1;
  const inset = 18;
  const sx = DIAL.CX + (dx / len) * inset;
  const sy = DIAL.CY + (dy / len) * inset;

  return (
    <g className="game-dial-pointer" pointerEvents="none">
      <line
        x1={sx}
        y1={sy}
        x2={tip.x}
        y2={tip.y}
        stroke={DIAL_COLORS.pointerDark}
        strokeWidth={20}
        strokeLinecap="round"
      />
      <line
        x1={sx}
        y1={sy}
        x2={tip.x}
        y2={tip.y}
        stroke={DIAL_COLORS.pointer}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <circle
        cx={tip.x}
        cy={tip.y}
        r={9}
        fill={DIAL_COLORS.pointer}
        stroke={DIAL_COLORS.pointerDark}
        strokeWidth={2.5}
      />
    </g>
  );
}

/** Ponteiro vermelho do psíquico — marca o alvo secreto no arco. */
function PsychicTargetPointer({ value }: { value: number }) {
  const tip = valueToPoint(value);
  const dx = tip.x - DIAL.CX;
  const dy = tip.y - DIAL.CY;
  const len = Math.hypot(dx, dy) || 1;
  const inset = 16;
  const sx = DIAL.CX + (dx / len) * inset;
  const sy = DIAL.CY + (dy / len) * inset;

  return (
    <g className="game-dial-psychic-pointer" pointerEvents="none">
      <line
        x1={sx}
        y1={sy}
        x2={tip.x}
        y2={tip.y}
        stroke={DIAL_COLORS.targetDot}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle
        cx={tip.x}
        cy={tip.y}
        r={12}
        fill="none"
        stroke={DIAL_COLORS.targetDot}
        strokeWidth={3.5}
      />
      <circle cx={tip.x} cy={tip.y} r={5} fill={DIAL_COLORS.targetDot} />
    </g>
  );
}

function TargetMarker({ target }: { target: number }) {
  const p = valueToPoint(target);
  return (
    <g aria-hidden>
      <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={DIAL_COLORS.targetDot} strokeWidth={3} opacity={0.9} />
      <circle cx={p.x} cy={p.y} r={4} fill={DIAL_COLORS.targetDot} />
    </g>
  );
}

const CAPTIONS: Record<GameDialMode, string> = {
  psychic:
    "O ponteiro vermelho marca o alvo secreto nesta escala. A zona colorida só aparece na revelação.",
  guess:
    "Arraste o ponteiro até onde acha que está o alvo entre os dois extremos.",
  reveal:
    "O ponteiro verde-água é o palpite da equipe. A zona colorida mostra o alvo e a pontuação.",
};

export default function GameDial({
  pointerValue,
  targetValue,
  revealed,
  mode,
  disabled = false,
  onChange,
  leftLabel,
  rightLabel,
}: GameDialProps) {
  const resolvedMode: GameDialMode =
    mode ?? (revealed ? "reveal" : onChange ? "guess" : "psychic");

  const svgRef = useRef<SVGSVGElement>(null);
  const gradId = useId().replace(/:/g, "");
  const interactive = !disabled && !!onChange && resolvedMode === "guess";
  const isPsychic = resolvedMode === "psychic";

  const displayValue =
    isPsychic && targetValue !== undefined ? targetValue : pointerValue;

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current || !onChange || disabled) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 400;
      const y = ((clientY - rect.top) / rect.height) * 228;
      const value = pointToValue(x, y);
      if (value !== null) onChange(value);
    },
    [onChange, disabled]
  );

  const arcPath = `M ${DIAL.CX - DIAL.R} ${DIAL.CY} A ${DIAL.R} ${DIAL.R} 0 0 1 ${DIAL.CX + DIAL.R} ${DIAL.CY}`;

  return (
    <div className="game-dial mx-auto w-full max-w-md space-y-3">
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between px-1 text-sm font-semibold">
          <span className="text-sky-300">{leftLabel}</span>
          <span className="text-rose-300">{rightLabel}</span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 400 228"
        className={`w-full touch-none select-none ${interactive ? "cursor-grab active:cursor-grabbing" : ""}`}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayValue}
        aria-label={
          isPsychic ? "Posição do alvo secreto no mostrador" : "Posição do palpite no mostrador"
        }
        onPointerDown={(e) => {
          if (!interactive) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          handlePointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!interactive || e.buttons === 0) return;
          handlePointer(e.clientX, e.clientY);
        }}
      >
        <defs>
          <linearGradient id={`dial-bg-${gradId}`} x1="200" y1="50" x2="200" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={DIAL_COLORS.cream} />
            <stop offset="45%" stopColor={DIAL_COLORS.cream} />
            <stop offset="100%" stopColor={DIAL_COLORS.navy} />
          </linearGradient>
          <clipPath id={`dial-clip-${gradId}`}>
            <path d={`${arcPath} L ${DIAL.CX} ${DIAL.CY} Z`} />
          </clipPath>
        </defs>

        {/* Fundo semicircular */}
        <path d={arcPath} fill={`url(#dial-bg-${gradId})`} stroke={DIAL_COLORS.rim} strokeWidth={4} strokeLinejoin="round" />

        {/* Estrelas na base */}
        <g clipPath={`url(#dial-clip-${gradId})`} opacity={0.75}>
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8eef8" />
          ))}
        </g>

        {/* Zonas de pontuação (só na revelação) */}
        {revealed && targetValue !== undefined && <ScoreZones target={targetValue} />}

        {/* Trilho do arco */}
        <path d={arcPath} fill="none" stroke={DIAL_COLORS.rim} strokeWidth={2} opacity={0.5} />

        {/* Eixo vermelho (atrás do ponteiro) */}
        <circle cx={DIAL.CX} cy={DIAL.CY} r={14} fill={DIAL_COLORS.hub} stroke={DIAL_COLORS.hubRing} strokeWidth={2.5} />

        {/* Ponteiro: vermelho (psíquico) ou verde-água (palpite/revelação) */}
        {isPsychic ? (
          <PsychicTargetPointer value={displayValue} />
        ) : (
          <GuessPointer value={displayValue} />
        )}

        {/* Marcador do alvo na revelação (além do palpite) */}
        {resolvedMode === "reveal" && targetValue !== undefined && (
          <TargetMarker target={targetValue} />
        )}

        <circle cx={DIAL.CX} cy={DIAL.CY} r={6} fill={DIAL_COLORS.rim} />
      </svg>

      {interactive && (
        <p className="text-center text-xs text-slate-400">Arraste no mostrador para posicionar o ponteiro.</p>
      )}

      <p className="text-center text-xs leading-relaxed text-slate-400">{CAPTIONS[resolvedMode]}</p>

    </div>
  );
}
