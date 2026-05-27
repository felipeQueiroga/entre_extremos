import type { ClientStopGameState } from "@entre-extremos/shared";

interface StopRoundSummaryProps {
  game: ClientStopGameState;
  playerNames: Record<string, string>;
}

export default function StopRoundSummary({ game, playerNames }: StopRoundSummaryProps) {
  if (!game.roundResults?.length) return null;

  const sorted = [...game.roundResults].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <section className="rounded-2xl border border-amber-400/30 bg-amber-950/30 p-4">
      <h3 className="mb-3 text-lg font-black text-amber-100">Pontos da rodada</h3>
      <ul className="space-y-2">
        {sorted.map((result) => (
          <li
            key={result.playerId}
            className="rounded-lg border border-amber-400/20 bg-slate-950/60 px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between font-bold text-slate-100">
              <span>{playerNames[result.playerId] ?? "Jogador"}</span>
              <span className="text-amber-200">+{result.totalPoints}</span>
            </div>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
              {result.categories
                .filter((item) => item.points > 0)
                .map((item) => (
                  <li key={item.categoryId}>
                    {item.answer} — {item.points} pts{item.unique ? " (única)" : ""}
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
