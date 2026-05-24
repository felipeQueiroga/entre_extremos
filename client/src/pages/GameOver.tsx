import { useNavigate, useParams } from "react-router-dom";
import ScoreBoard from "../components/ScoreBoard";
import { useGame } from "../hooks/GameContext";
import { getPlayerName } from "../hooks/useGameHelpers";
import { clearSession } from "../utils/session";

export default function GameOver() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { state, winners, restartGame, leaveRoom } = useGame();

  if (!state || state.code !== code?.toUpperCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Carregando resultado...</p>
      </div>
    );
  }

  const winnerNames =
    state.mode === "teams" && state.teamScore
      ? Object.entries(state.teamScore)
          .filter(([, score]) => score >= state.winningScore)
          .map(([teamId]) => `Time ${teamId}`)
      : winners.map((id) => getPlayerName(state, id));

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10 text-center">
      <h1 className="text-4xl font-bold">Fim de jogo!</h1>

      {winnerNames.length > 0 ? (
        <p className="mt-4 text-xl text-emerald-300">
          Vencedor{winnerNames.length > 1 ? "es" : ""}: {winnerNames.join(", ")}
        </p>
      ) : (
        <p className="mt-4 text-xl text-slate-300">Partida encerrada</p>
      )}

      <div className="my-8">
        <ScoreBoard state={state} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            restartGame();
            navigate(`/lobby/${state.code}`);
          }}
          className="rounded-lg bg-emerald-600 py-4 font-semibold hover:bg-emerald-500"
        >
          Jogar novamente
        </button>
        <button
          type="button"
          onClick={() => {
            leaveRoom();
            clearSession();
            navigate("/");
          }}
          className="rounded-lg bg-slate-700 py-4 font-semibold hover:bg-slate-600"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
