import type { ClientRoomState } from "@entre-extremos/shared";

interface TurnIndicatorProps {
  state: ClientRoomState;
  currentPlayerId: string;
  direction: 1 | -1;
}

export default function TurnIndicator({ state, currentPlayerId, direction }: TurnIndicatorProps) {
  const currentPlayer = state.players.find((player) => player.id === currentPlayerId);
  const isLocalTurn = currentPlayerId === state.playerId;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
      <p className="text-sm uppercase tracking-wide text-slate-400">Vez atual</p>
      <p className={`text-2xl font-bold ${isLocalTurn ? "text-emerald-300" : "text-white"}`}>
        {isLocalTurn ? "Sua vez" : currentPlayer?.name ?? "Jogador"}
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Direção: {direction === 1 ? "horária" : "anti-horária"}
      </p>
    </div>
  );
}
