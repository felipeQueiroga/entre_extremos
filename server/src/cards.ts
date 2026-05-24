import type { Card } from "@entre-extremos/shared";

export const CARDS: Card[] = [
  { id: "1", left: "Frio", right: "Quente" },
  { id: "2", left: "Feio", right: "Bonito" },
  { id: "3", left: "Barato", right: "Caro" },
  { id: "4", left: "Normal", right: "Estranho" },
  { id: "5", left: "Chato", right: "Divertido" },
  { id: "6", left: "Fácil", right: "Difícil" },
  { id: "7", left: "Infantil", right: "Adulto" },
  { id: "8", left: "Comum", right: "Raro" },
  { id: "9", left: "Calmo", right: "Caótico" },
  { id: "10", left: "Seguro", right: "Perigoso" },
];

export function pickRandomCard(usedCardIds: string[]): Card {
  const available = CARDS.filter((c) => !usedCardIds.includes(c.id));
  const pool = available.length > 0 ? available : CARDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomTargetPosition(): number {
  return Math.floor(Math.random() * 101);
}
