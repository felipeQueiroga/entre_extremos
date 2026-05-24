import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CardDisplay from "../components/CardDisplay";
import GuesserView from "../components/GuesserView";
import OpponentDirectionView from "../components/OpponentDirectionView";
import PsychicView from "../components/PsychicView";
import RevealView from "../components/RevealView";
import ScoreBoard from "../components/ScoreBoard";
import { useGame } from "../hooks/GameContext";
import {
  getPlayerName,
  isGuesser,
  isHost,
  isOpponentTeam,
  isPsychic,
  useRoomRedirect,
} from "../hooks/useGameHelpers";
import { getStoredPlayerId, getStoredPlayerName, getStoredRoomCode } from "../utils/session";

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    state,
    joinRoom,
    submitClue,
    submitGuess,
    submitDirection,
    nextRound,
    error,
    clearError,
  } = useGame();

  useRoomRedirect(code);

  useEffect(() => {
    if (state?.status === "finished") {
      navigate(`/game-over/${state.code}`, { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    async function reconnect() {
      if (state?.code === code?.toUpperCase()) return;
      const storedCode = getStoredRoomCode();
      const storedId = getStoredPlayerId();
      const storedName = getStoredPlayerName();
      if (storedCode === code?.toUpperCase() && storedId && storedName) {
        await joinRoom(code!, storedName, storedId);
      }
    }
    reconnect();
  }, [code, state, joinRoom]);

  if (!state || !state.currentRound || state.code !== code?.toUpperCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Carregando partida...</p>
      </div>
    );
  }

  const round = state.currentRound;
  const psychicName = getPlayerName(state, round.psychicPlayerId);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Rodada {round.roundNumber}</p>
          <h1 className="text-2xl font-bold">Entre Extremos</h1>
        </div>
        <ScoreBoard state={state} />
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-900/40 px-4 py-2 text-center text-rose-200">
          {error}
          <button type="button" onClick={clearError} className="ml-2 underline">
            ok
          </button>
        </p>
      )}

      <CardDisplay card={round.card} />

      <p className="my-4 text-center text-slate-300">
        Psíquico: <strong>{psychicName}</strong>
        {state.mode === "teams" && round.activeTeam && (
          <span className="ml-2 text-slate-500">(Time {round.activeTeam})</span>
        )}
      </p>

      <div className="mt-6 space-y-6">
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
            <p>Aguardando o palpite do time...</p>
          </div>
        )}

        {round.phase === "opponent_direction" && isOpponentTeam(state) && round.guessPosition !== undefined && (
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

        {(round.phase === "reveal" || round.phase === "ended") && (
          <RevealView
            state={state}
            onNextRound={nextRound}
            canAdvance={isHost(state)}
          />
        )}
      </div>
    </div>
  );
}
