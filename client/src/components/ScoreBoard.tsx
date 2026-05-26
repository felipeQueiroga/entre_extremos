import type { ClientRoomState } from "@entre-extremos/shared";

interface ScoreBoardProps {
  state: ClientRoomState;
}

export default function ScoreBoard({ state }: ScoreBoardProps) {
  if (state.mode === "teams" && state.teamScore) {
    return (
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
        <div className="rounded-xl bg-slate-800 px-6 py-3 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-400">Time A</p>
          <p className="text-3xl font-bold text-sky-400">{state.teamScore.A}</p>
        </div>
        <div className="rounded-xl bg-slate-800 px-6 py-3 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-400">Time B</p>
          <p className="text-3xl font-bold text-rose-400">{state.teamScore.B}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {state.players.map((player) => (
        <div
          key={player.id}
          className={`rounded-xl px-3 py-2 text-center sm:px-4 sm:py-3 ${
            player.id === state.playerId ? "bg-indigo-900/50 ring-1 ring-indigo-500" : "bg-slate-800"
          }`}
        >
          <p className="truncate text-sm text-slate-400">{player.name}</p>
          <p className="text-2xl font-bold">{state.score[player.id] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
