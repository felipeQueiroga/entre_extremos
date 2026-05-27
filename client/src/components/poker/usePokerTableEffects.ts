import { useEffect, useRef, useState } from "react";
import type { ClientPokerGameState } from "@entre-extremos/shared";

const ACTIVE_BETTING_PHASES = new Set(["preflop", "flop", "turn", "river"]);

interface Snapshot {
  communityCount: number;
  phase: ClientPokerGameState["phase"];
  lastAction?: string;
  playerStatuses: Record<string, string>;
}

function snapshot(game: ClientPokerGameState): Snapshot {
  return {
    communityCount: game.communityCards.length,
    phase: game.phase,
    lastAction: game.lastAction,
    playerStatuses: Object.fromEntries(game.players.map((player) => [player.playerId, player.status])),
  };
}

export function usePokerTableEffects(game: ClientPokerGameState) {
  const prevRef = useRef<Snapshot | null>(null);
  const [allInPlayerIds, setAllInPlayerIds] = useState<Set<string>>(new Set());
  const [revealedCardIndices, setRevealedCardIndices] = useState<Set<number>>(new Set());
  const [tableReveal, setTableReveal] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    if (!prev) {
      prevRef.current = snapshot(game);
      return;
    }

    const flashAllIn = new Set<string>();
    game.players.forEach((player) => {
      if (player.status === "all-in" && prev.playerStatuses[player.playerId] !== "all-in") {
        flashAllIn.add(player.playerId);
      }
    });
    if (game.lastAction?.toLowerCase().includes("all-in")) {
      game.players.forEach((player) => {
        if (game.lastAction?.includes(player.name)) {
          flashAllIn.add(player.playerId);
        }
      });
    }

    const flashReveal = new Set<number>();
    if (game.communityCards.length > prev.communityCount) {
      for (let index = prev.communityCount; index < game.communityCards.length; index += 1) {
        flashReveal.add(index);
      }
    }

    const phaseAdvanced =
      game.phase !== prev.phase &&
      (game.phase === "flop" || game.phase === "turn" || game.phase === "river");

    const timers: number[] = [];

    if (flashAllIn.size > 0) {
      setAllInPlayerIds(flashAllIn);
      timers.push(window.setTimeout(() => setAllInPlayerIds(new Set()), 700));
    }

    if (flashReveal.size > 0) {
      setRevealedCardIndices(flashReveal);
      timers.push(window.setTimeout(() => setRevealedCardIndices(new Set()), 500));
    }

    if (phaseAdvanced || flashReveal.size > 0) {
      setTableReveal(true);
      timers.push(window.setTimeout(() => setTableReveal(false), 600));
    }

    prevRef.current = snapshot(game);
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [game]);

  const currentPlayerId =
    ACTIVE_BETTING_PHASES.has(game.phase) && !game.isGameOver ? game.currentPlayerId : undefined;

  return {
    allInPlayerIds,
    revealedCardIndices,
    tableReveal,
    currentPlayerId,
  };
}

export const POKER_TURN_SECONDS = 30;

export function isPokerTimerActive(game: ClientPokerGameState): boolean {
  return (
    !!game.turnDeadlineAt &&
    ACTIVE_BETTING_PHASES.has(game.phase) &&
    !game.isGameOver
  );
}
