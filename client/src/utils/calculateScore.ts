/** Pontuação pelo palpite vs alvo (distância na escala 0–100). */
export function calculateScore(pointerValue: number, targetValue: number): number {
  const distance = Math.abs(pointerValue - targetValue);

  if (distance <= 4) return 4;
  if (distance <= 8) return 3;
  if (distance <= 12) return 2;
  return 0;
}
