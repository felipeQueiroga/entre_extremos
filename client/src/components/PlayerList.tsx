import type { ClientRoomState } from "@entre-extremos/shared";

interface PlayerListProps {
  state: ClientRoomState;
}

export default function PlayerList({ state }: PlayerListProps) {
  return (
    <ul className="space-y-2">
      {state.players.map((player) => (
        <li
          key={player.id}
          className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3"
        >
          <div>
            <p className="font-medium">
              {player.name}
              {player.isHost && (
                <span className="ml-2 text-xs text-amber-400">(host)</span>
              )}
            </p>
            {state.mode === "teams" && player.team && (
              <p className="text-xs text-slate-400">Time {player.team}</p>
            )}
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              player.connected ? "bg-emerald-400" : "bg-slate-500"
            }`}
            title={player.connected ? "Conectado" : "Desconectado"}
          />
        </li>
      ))}
    </ul>
  );
}
