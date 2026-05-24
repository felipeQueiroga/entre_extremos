import type { RoundResult, Team } from "@entre-extremos/shared";

export function scoreFromDistance(distance: number): number {
  if (distance <= 4) return 4;
  if (distance <= 8) return 3;
  if (distance <= 12) return 2;
  return 0;
}

export function getRealDirection(
  targetPosition: number,
  guessPosition: number
): "left" | "right" {
  return targetPosition < guessPosition ? "left" : "right";
}

export function calculateRoundResult(
  targetPosition: number,
  guessPosition: number,
  guesserId: string,
  opponentDirectionGuess?: "left" | "right"
): RoundResult {
  const distance = Math.abs(targetPosition - guessPosition);
  const guesserPoints = scoreFromDistance(distance);
  let opponentPoints = 0;

  if (opponentDirectionGuess !== undefined) {
    const realDirection = getRealDirection(targetPosition, guessPosition);
    if (opponentDirectionGuess === realDirection) {
      opponentPoints = 1;
    }
  }

  return {
    distance,
    guesserPoints,
    opponentPoints,
    guesserId,
  };
}

export function getWinners(
  score: Record<string, number>,
  winningScore: number
): string[] {
  const maxScore = Math.max(...Object.values(score), 0);
  if (maxScore < winningScore) return [];
  return Object.entries(score)
    .filter(([, points]) => points >= winningScore)
    .map(([id]) => id);
}

export function getTeamWinners(
  teamScore: { A: number; B: number },
  winningScore: number
): Team[] {
  const winners: Team[] = [];
  if (teamScore.A >= winningScore) winners.push("A");
  if (teamScore.B >= winningScore) winners.push("B");
  return winners;
}