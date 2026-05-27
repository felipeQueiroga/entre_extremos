import type { ClientPokerGameState } from "@entre-extremos/shared";

interface PokerHandSummaryProps {
  game: ClientPokerGameState;
}

export default function PokerHandSummary({ game }: PokerHandSummaryProps) {
  if (game.phase !== "hand-ended") return null;

  const winnerNames = (game.winners ?? [])
    .map((winnerId) => game.players.find((player) => player.playerId === winnerId)?.name)
    .filter(Boolean)
    .join(", ");
  const winnerLabels = [
    ...new Set(
      (game.handResults ?? [])
        .filter((result) => game.winners?.includes(result.playerId))
        .map((result) => result.label)
    ),
  ];

  return (
    <section className="rounded-xl border border-amber-400/40 bg-amber-950/40 p-3">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-200">Resultado da mão</p>
      <h3 className="mt-1 text-lg font-black text-amber-50">{winnerNames || "Mão encerrada"}</h3>
      {winnerLabels.length > 0 && (
        <p className="mt-1 text-sm font-bold text-amber-100">
          {winnerLabels.join(" / ")}
        </p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(game.handResults ?? []).map((result) => {
          const player = game.players.find((item) => item.playerId === result.playerId);
          return (
            <p key={result.playerId} className="rounded-lg bg-slate-950/50 px-3 py-2 text-sm text-slate-200">
              <span className="font-bold">{player?.name ?? "Jogador"}:</span> {result.label}
            </p>
          );
        })}
      </div>
    </section>
  );
}
