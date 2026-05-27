import type { ClientRoomState } from "@entre-extremos/shared";
import { useGame } from "../../hooks/GameContext";
import { isHost } from "../../hooks/useGameHelpers";
import PokerActions from "./PokerActions";
import PokerCard from "./PokerCard";
import PokerHandSummary from "./PokerHandSummary";
import PokerPlayerSeat from "./PokerPlayerSeat";
import PokerTable from "./PokerTable";

interface PokerGameProps {
  state: ClientRoomState;
}

export default function PokerGame({ state }: PokerGameProps) {
  const {
    pokerFold,
    pokerCheck,
    pokerCall,
    pokerBet,
    pokerRaise,
    pokerAllIn,
    pokerNextHand,
    pokerRestart,
  } = useGame();

  const game = state.gameState?.kind === "poker" ? state.gameState : undefined;

  if (!game) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Poker Texas Hold'em</p>
        <h2 className="mt-2 text-3xl font-black">Mesa pronta para receber as cartas</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          O host inicia a partida no lobby. Cada jogador recebe fichas virtuais e duas cartas
          privadas; as cartas comunitárias aparecem no centro da mesa.
        </p>
      </section>
    );
  }

  const currentName = game.players.find((player) => player.playerId === game.currentPlayerId)?.name;
  const localPlayer = game.players.find((player) => player.playerId === state.playerId);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
              Mão #{game.handNumber}
            </p>
            <h2 className="text-2xl font-black">Poker Texas Hold'em</h2>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>Jogador da vez: {currentName ?? "aguardando"}</p>
            <p>
              Blinds {state.pokerOptions.smallBlind}/{state.pokerOptions.bigBlind}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {game.players.map((player, index) => (
          <PokerPlayerSeat
            key={player.playerId}
            player={player}
            isCurrent={player.playerId === game.currentPlayerId}
            isDealer={index === game.dealerIndex}
            isWinner={(game.winners ?? []).includes(player.playerId)}
          />
        ))}
      </div>

      <PokerTable game={game} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Sua mão</p>
            <p className="text-xs text-slate-400">
              Fichas: {localPlayer?.chips ?? 0} · Aposta atual: {localPlayer?.currentBet ?? 0}
            </p>
          </div>
          {game.phase === "hand-ended" && isHost(state) && (
            <button
              type="button"
              onClick={pokerNextHand}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold hover:bg-emerald-500"
            >
              Próxima mão
            </button>
          )}
        </div>
        <div className="flex justify-center -space-x-5">
          {(game.hand.length ? game.hand : [undefined, undefined]).slice(0, 2).map((card, index) => (
            <PokerCard key={card?.id ?? index} card={card} hidden={!card} />
          ))}
        </div>
      </section>

      <PokerActions
        game={game}
        localPlayerId={state.playerId}
        onFold={pokerFold}
        onCheck={pokerCheck}
        onCall={pokerCall}
        onBet={pokerBet}
        onRaise={pokerRaise}
        onAllIn={pokerAllIn}
      />

      <PokerHandSummary game={game} />

      {isHost(state) && (
        <button
          type="button"
          onClick={pokerRestart}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-900"
        >
          Voltar ao lobby / reiniciar mesa
        </button>
      )}
    </div>
  );
}
