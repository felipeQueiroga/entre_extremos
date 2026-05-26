import type { ClientFourColorsGameState } from "@entre-extremos/shared";
import { CardBack } from "./Card";

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
  const opponents = game.players.filter((player) => player.playerId !== localPlayerId);
  const gridClass = opponents.length <= 1 ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-950/40 p-4 shadow-inner">
      <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.25em] text-emerald-100/80">
        Mesa
      </h2>
      <ul className={`grid gap-3 ${gridClass}`}>
        {opponents.map((player) => {
          const canChallenge =
            player.playerId !== localPlayerId && player.cardCount === 1 && !player.hasCalledOne;
          const visibleBacks = player.cardCount;
          return (
            <li
              key={player.playerId}
              className={`rounded-2xl border px-4 py-3 ${
                player.playerId === game.currentPlayerId
                  ? "border-amber-300 bg-amber-950/50"
                  : "border-emerald-700/40 bg-slate-950/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-sm text-slate-400">
                    {player.cardCount} carta(s)
                    {player.cardCount === 1 && player.hasCalledOne ? " · chamou 1" : ""}
                  </p>
                </div>
                <span className={player.connected ? "text-xs text-emerald-300" : "text-xs text-slate-500"}>
                  {player.connected ? "online" : "offline"}
                </span>
              </div>
              <div className="mt-3 flex min-h-20 items-center justify-center overflow-hidden">
                <div className="flex max-w-full flex-wrap justify-center pl-7">
                  {Array.from({ length: visibleBacks }).map((_, index) => (
                    <CardBack
                      key={index}
                      className="h-16 w-11 -ml-7 transition-transform"
                    />
                  ))}
                </div>
              </div>
              {canChallenge && (
                <button
                  type="button"
                  onClick={() => onChallenge(player.playerId)}
                  className="mt-3 w-full rounded-full bg-rose-600 px-3 py-2 text-xs font-bold hover:bg-rose-500"
                >
                  Punir +2
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
