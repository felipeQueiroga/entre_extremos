import type { ClientFourColorsGameState } from "@entre-extremos/shared";

interface FourColorsPlayerListProps {
  game: ClientFourColorsGameState;
  localPlayerId: string;
  onChallenge: (targetPlayerId: string) => void;
}

export default function PlayerList({
  game,
  localPlayerId,
  onChallenge,
}: FourColorsPlayerListProps) {
  return (
    <section className="rounded-2xl bg-slate-900 p-4">
      <h2 className="mb-3 text-lg font-semibold">Jogadores</h2>
      <ul className="space-y-2">
        {game.players.map((player) => {
          const canChallenge =
            player.playerId !== localPlayerId && player.cardCount === 1 && !player.hasCalledOne;
          return (
            <li
              key={player.playerId}
              className={`rounded-lg px-4 py-3 ${
                player.playerId === game.currentPlayerId ? "bg-indigo-900/50" : "bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {player.name}
                    {player.playerId === localPlayerId && (
                      <span className="ml-2 text-xs text-indigo-300">(você)</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-400">
                    {player.cardCount} carta(s)
                    {player.cardCount === 1 && player.hasCalledOne ? " · chamou 1" : ""}
                  </p>
                </div>
                {canChallenge && (
                  <button
                    type="button"
                    onClick={() => onChallenge(player.playerId)}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold hover:bg-rose-500"
                  >
                    Punir +2
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
