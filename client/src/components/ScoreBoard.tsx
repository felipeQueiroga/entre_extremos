import type { ClientRoomState } from "@entre-extremos/shared";

interface ScoreBoardProps {
  state: ClientRoomState;
}

export default function ScoreBoard({ state }: ScoreBoardProps) {
  if (state.mode === "teams" && state.teamScore) {
    return (
      <div className="flex gap-6 justify-center">
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
    <div className="grid gap-3 sm:grid-cols-2">
      {state.players.map((player) => (
        <div
          key={player.id}
          className={`rounded-xl px-4 py-3 ${
            player.id === state.playerId ? "bg-indigo-900/50 ring-1 ring-indigo-500" : "bg-slate-800"
          }`}
        >
          <p className="text-sm text-slate-400">{player.name}</p>
          <p className="text-2xl font-bold">{state.score[player.id] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
