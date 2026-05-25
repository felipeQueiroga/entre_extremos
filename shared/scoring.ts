export const SCORE_ZONES = [
  { maxDistance: 4, points: 4, color: "#E53935", label: "Vermelho" },
  { maxDistance: 8, points: 3, color: "#4DD0E1", label: "Verde/azul claro" },
  { maxDistance: 12, points: 2, color: "#FFCA28", label: "Amarelo" },
] as const;

export function scoreFromDistance(distance: number): number {
  for (const zone of SCORE_ZONES) {
    if (distance <= zone.maxDistance) return zone.points;
  }
  return 0;
}
