import { useEffect, useState } from "react";
import type { ClientPokerGameState } from "@entre-extremos/shared";

interface PokerActionsProps {
  game: ClientPokerGameState;
  localPlayerId: string;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onBet: (amount: number) => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
}

export default function PokerActions({
  game,
  localPlayerId,
  onFold,
  onCheck,
  onCall,
  onBet,
  onRaise,
  onAllIn,
}: PokerActionsProps) {
  const [amount, setAmount] = useState(game.minBet);
  const acting = game.canCheck || game.canCall || game.canBet || game.canRaise || game.canFold;
  const local = game.players.find((player) => player.playerId === localPlayerId);
  const maxAmount = Math.max(game.minBet, (local?.chips ?? 0) + (local?.currentBet ?? 0));

  useEffect(() => {
    setAmount(game.minBet);
  }, [game.minBet, game.currentPlayerId]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-100">Ações</p>
          <p className="text-xs text-slate-400">
            {acting ? "Sua vez de jogar." : "Aguardando outro jogador."}
          </p>
        </div>
        {game.callAmount > 0 && (
          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-slate-950">
            Pagar {game.callAmount}
          </span>
        )}
      </div>

      {(game.canBet || game.canRaise) && (
        <label className="mb-3 block text-sm text-slate-400">
          Valor {game.canRaise ? "total da aposta" : "da aposta"}
          <input
            type="number"
            min={game.minBet}
            max={maxAmount}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onCheck}
          disabled={!game.canCheck}
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-bold hover:bg-slate-600 disabled:opacity-40"
        >
          Check
        </button>
        <button
          type="button"
          onClick={onCall}
          disabled={!game.canCall}
          className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold hover:bg-sky-500 disabled:opacity-40"
        >
          Pagar
        </button>
        <button
          type="button"
          onClick={() => onBet(amount)}
          disabled={!game.canBet}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold hover:bg-emerald-500 disabled:opacity-40"
        >
          Apostar
        </button>
        <button
          type="button"
          onClick={() => onRaise(amount)}
          disabled={!game.canRaise}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold hover:bg-indigo-500 disabled:opacity-40"
        >
          Aumentar
        </button>
        <button
          type="button"
          onClick={onAllIn}
          disabled={!game.canAllIn}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-amber-400 disabled:opacity-40"
        >
          All-in
        </button>
        <button
          type="button"
          onClick={onFold}
          disabled={!game.canFold}
          className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-bold hover:bg-rose-600 disabled:opacity-40"
        >
          Desistir
        </button>
      </div>
    </section>
  );
}
