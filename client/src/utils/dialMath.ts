/** Geometria do mostrador: 0 = esquerda, 100 = direita, arco superior 180°. */

export const DIAL = {
  CX: 200,
  CY: 210,
  R: 148,
  BAND_OUTER: 148,
  BAND_INNER: 108,
  POINTER_LEN: 118,
} as const;

export const DIAL_COLORS = {
  cream: "#F8F4EC",
  navy: "#152238",
  rim: "#0f2942",
  pointer: "#4DD4C4",
  pointerDark: "#2A9D8F",
  hub: "#E85D4A",
  hubRing: "#c43d2e",
  zone4: "#E63946",
  zone3: "#5EC4C4",
  zone2: "#F4C430",
  targetDot: "#E85D4A",
} as const;

function valueToRad(value: number): number {
  return Math.PI * (1 - value / 100);
}

function polar(r: number, t: number): { x: number; y: number } {
  return {
    x: DIAL.CX + r * Math.cos(t),
    y: DIAL.CY - r * Math.sin(t),
  };
}

export function valueToPoint(value: number): { x: number; y: number } {
  return polar(DIAL.R, valueToRad(value));
}

export function valueToRotationDeg(value: number): number {
  const p = valueToPoint(value);
  return (Math.atan2(p.y - DIAL.CY, p.x - DIAL.CX) * 180) / Math.PI;
}

/** Faixa entre dois valores na escala, entre rInner e rOuter. */
export function arcBandPath(
  valueStart: number,
  valueEnd: number,
  rOuter: number,
  rInner: number
): string {
  const start = Math.max(0, Math.min(100, valueStart));
  const end = Math.max(0, Math.min(100, valueEnd));
  if (end <= start) return "";

  const t0 = valueToRad(start);
  const t1 = valueToRad(end);
  const p0o = polar(rOuter, t0);
  const p1o = polar(rOuter, t1);
  const p1i = polar(rInner, t1);
  const p0i = polar(rInner, t0);

  return [
    `M ${p0o.x} ${p0o.y}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${p1o.x} ${p1o.y}`,
    `L ${p1i.x} ${p1i.y}`,
    `A ${rInner} ${rInner} 0 0 0 ${p0i.x} ${p0i.y}`,
    "Z",
  ].join(" ");
}

export function pointToValue(x: number, y: number): number | null {
  if (y > DIAL.CY + 8) return null;

  const dx = (x - DIAL.CX) / DIAL.R;
  const dy = (DIAL.CY - y) / DIAL.R;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.25) return 50;

  let t = Math.atan2(dy, dx);
  if (t < 0) {
    return t < -Math.PI / 4 ? 100 : 0;
  }
  const value = ((Math.PI - t) / Math.PI) * 100;
  return Math.max(0, Math.min(100, Math.round(value)));
}
