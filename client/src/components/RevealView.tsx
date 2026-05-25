import GameDial from "./GameDial";
import { calculateScore } from "../utils/calculateScore";
import { getPlayerName } from "../hooks/useGameHelpers";
import type { ClientRoomState } from "@entre-extremos/shared";

interface RevealViewProps {
  state: ClientRoomState;
  onNextRound?: () => void;
  canAdvance?: boolean;
}

export default function RevealView({ state, onNextRound, canAdvance }: RevealViewProps) {
  const round = state.currentRound!;
  const guess = round.guessPosition ?? 50;
  const target = round.targetPosition;
  const distance =
    target !== undefined ? Math.abs(target - guess) : null;
  const points =
    target !== undefined ? calculateScore(guess, target) : round.lastRoundPoints ?? 0;

  return (
    <div className="space-y-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 animate-reveal-fade">
      <h2 className="text-xl font-semibold text-emerald-200">Revelação</h2>

      {round.clue && (
        <p className="text-slate-300">
          Dica: <span className="font-semibold">{round.clue}</span>
        </p>
      )}

      <div className="animate-reveal-gauge">
        <GameDial
          mode="reveal"
          pointerValue={guess}
          targetValue={target}
          revealed={target !== undefined}
          disabled
          leftLabel={round.card.left}
          rightLabel={round.card.right}
        />
      </div>

      {distance !== null && (
        <div className="grid gap-2 text-center sm:grid-cols-2">
          <p className="rounded-lg bg-slate-900 px-4 py-3">
            Distância: <strong>{distance}</strong>
          </p>
          <p className="rounded-lg bg-slate-900 px-4 py-3">
            Pontos: <strong>{round.lastRoundPoints ?? points}</strong>
            {round.lastRoundGuesserId && (
              <span className="block text-sm text-slate-400">
                ({getPlayerName(state, round.lastRoundGuesserId)})
              </span>
            )}
          </p>
        </div>
      )}

      {state.mode === "teams" && round.opponentDirectionGuess && (
        <p className="text-center text-slate-300">
          Aposta adversária:{" "}
          <strong>{round.opponentDirectionGuess === "left" ? "Esquerda" : "Direita"}</strong>
        </p>
      )}

      {canAdvance && onNextRound && state.status === "playing" && (
        <button
          type="button"
          onClick={onNextRound}
          className="w-full rounded-lg bg-emerald-600 py-3 font-semibold hover:bg-emerald-500"
        >
          Próxima rodada
        </button>
      )}
    </div>
  );
}
