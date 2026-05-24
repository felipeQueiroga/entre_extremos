import ScaleSlider from "./ScaleSlider";
import { getPlayerName } from "../hooks/useGameHelpers";
import type { ClientRoomState } from "@entre-extremos/shared";

interface RevealViewProps {
  state: ClientRoomState;
  onNextRound?: () => void;
  canAdvance?: boolean;
}

export default function RevealView({ state, onNextRound, canAdvance }: RevealViewProps) {
  const round = state.currentRound!;
  const distance =
    round.targetPosition !== undefined && round.guessPosition !== undefined
      ? Math.abs(round.targetPosition - round.guessPosition)
      : null;

  return (
    <div className="space-y-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6">
      <h2 className="text-xl font-semibold text-emerald-200">Revelação</h2>

      {round.clue && (
        <p className="text-slate-300">
          Dica: <span className="font-semibold">{round.clue}</span>
        </p>
      )}

      <ScaleSlider
        value={round.guessPosition ?? 50}
        targetPosition={round.targetPosition}
        guessPosition={round.guessPosition}
        showTarget
        showGuess
        disabled
        leftLabel={round.card.left}
        rightLabel={round.card.right}
      />

      {distance !== null && (
        <div className="grid gap-2 text-center sm:grid-cols-2">
          <p className="rounded-lg bg-slate-900 px-4 py-3">
            Distância: <strong>{distance}</strong>
          </p>
          <p className="rounded-lg bg-slate-900 px-4 py-3">
            Pontos: <strong>{round.lastRoundPoints ?? 0}</strong>
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
          Aposta adversária: <strong>{round.opponentDirectionGuess === "left" ? "Esquerda" : "Direita"}</strong>
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
