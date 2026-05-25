import type { ClientRoomState } from "@entre-extremos/shared";
import CardDisplay from "../CardDisplay";
import GuesserView from "../GuesserView";
import OpponentDirectionView from "../OpponentDirectionView";
import PsychicThemeView from "../PsychicThemeView";
import PsychicView from "../PsychicView";
import RevealView from "../RevealView";
import ScoreBoard from "../ScoreBoard";
import SuspenseReveal from "../SuspenseReveal";
import {
  getPlayerName,
  isGuesser,
  isHost,
  isOpponentTeam,
  isPsychic,
} from "../../hooks/useGameHelpers";

interface EntreExtremosGameProps {
  state: ClientRoomState;
  submitTheme: (left: string, right: string) => void;
  submitClue: (clue: string) => void;
  submitGuess: (position: number) => void;
  submitDirection: (direction: "left" | "right") => void;
  nextRound: () => void;
}

export default function EntreExtremosGame({
  state,
  submitTheme,
  submitClue,
  submitGuess,
  submitDirection,
  nextRound,
}: EntreExtremosGameProps) {
  const round = state.currentRound;

  if (!round) {
    return (
      <div className="rounded-2xl bg-slate-900 p-6 text-center text-slate-300">
        Preparando rodada...
      </div>
    );
  }

  const psychicName = getPlayerName(state, round.psychicPlayerId);
  const showCard = round.card.left && round.card.right && round.phase !== "psychic_theme";

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Rodada {round.roundNumber}</p>
          <h1 className="text-2xl font-bold">Entre Extremos</h1>
        </div>
        <ScoreBoard state={state} />
      </header>

      {showCard && <CardDisplay card={round.card} />}

      <p className="my-4 text-center text-slate-300">
        Psíquico: <strong>{psychicName}</strong>
        {state.mode === "teams" && round.activeTeam && (
          <span className="ml-2 text-slate-500">(Time {round.activeTeam})</span>
        )}
      </p>

      <div className="mt-6 space-y-6">
        {round.phase === "psychic_theme" && isPsychic(state) && (
          <PsychicThemeView onSubmit={submitTheme} />
        )}

        {round.phase === "psychic_theme" && !isPsychic(state) && (
          <div className="rounded-2xl bg-slate-900 p-6 text-center text-slate-300">
            <strong>{psychicName}</strong> está definindo o tema da rodada...
          </div>
        )}

        {round.phase === "psychic_clue" && isPsychic(state) && (
          <PsychicView
            targetPosition={round.targetPosition}
            leftLabel={round.card.left}
            rightLabel={round.card.right}
            onSubmit={submitClue}
          />
        )}

        {round.phase === "psychic_clue" && !isPsychic(state) && (
          <div className="rounded-2xl bg-slate-900 p-6 text-center text-slate-300">
            Aguardando <strong>{psychicName}</strong> enviar a dica...
          </div>
        )}

        {round.phase === "guess" && isGuesser(state) && round.clue && (
          <GuesserView
            clue={round.clue}
            leftLabel={round.card.left}
            rightLabel={round.card.right}
            onSubmit={submitGuess}
          />
        )}

        {round.phase === "guess" && !isGuesser(state) && (
          <div className="rounded-2xl bg-slate-900 p-6 text-center text-slate-300">
            {round.clue && (
              <p className="mb-2">
                Dica: <strong>{round.clue}</strong>
              </p>
            )}
            <p>Aguardando o palpite...</p>
          </div>
        )}

        {round.phase === "opponent_direction" &&
          isOpponentTeam(state) &&
          round.guessPosition !== undefined && (
            <OpponentDirectionView
              guessPosition={round.guessPosition}
              leftLabel={round.card.left}
              rightLabel={round.card.right}
              onSubmit={submitDirection}
            />
          )}

        {round.phase === "opponent_direction" && !isOpponentTeam(state) && (
          <div className="rounded-2xl bg-slate-900 p-6 text-center text-slate-300">
            Aguardando aposta do time adversário...
          </div>
        )}

        {round.phase === "suspense" && (
          <SuspenseReveal leftLabel={round.card.left} rightLabel={round.card.right} />
        )}

        {(round.phase === "reveal" || round.phase === "ended") && (
          <RevealView state={state} onNextRound={nextRound} canAdvance={isHost(state)} />
        )}
      </div>
    </div>
  );
}
