import type {
  Card as FourColorsCard,
  ClientFourColorsGameState,
  ClientRoomState,
} from "@entre-extremos/shared";
import { useGame } from "../../hooks/GameContext";
import ColorPickerModal from "./ColorPickerModal";
import DeckPile from "./DeckPile";
import DiscardPile from "./DiscardPile";
import OneButton from "./OneButton";
import PlayerHand from "./PlayerHand";
import PlayerList from "./PlayerList";
import TurnIndicator from "./TurnIndicator";

interface FourColorsGameProps {
  state: ClientRoomState;
}

function isPlayable(card: FourColorsCard, game: ClientFourColorsGameState): boolean {
  if (game.pendingColorChoice || game.pendingHandSwap) return false;
  if (game.pendingDrawAmount && game.pendingDrawType) {
    return card.type === game.pendingDrawType;
  }
  if (card.type === "wild" || card.type === "wildDraw4") return true;
  if (card.color === game.currentColor) return true;
  if (card.type !== "number" && card.type === game.currentType) return true;
  return card.type === "number" && game.currentType === "number" && card.value === game.currentValue;
}

function drawStackLabel(game: ClientFourColorsGameState): string {
  if (!game.pendingDrawAmount) return "";
  const typeLabel = game.pendingDrawType === "draw2" ? "+2" : "+4";
  return `${game.pendingDrawAmount} carta(s) acumuladas. Para empilhar, jogue outro ${typeLabel}.`;
}

export default function FourColorsGame({ state }: FourColorsGameProps) {
  const {
    fourColorsPlayCard,
    fourColorsDrawCard,
    fourColorsChooseColor,
    fourColorsCallOne,
    fourColorsChallengeOne,
    fourColorsPassTurn,
    fourColorsChooseHandSwapTarget,
  } = useGame();

  const game = state.gameState?.kind === "four-colors" ? state.gameState : undefined;

  if (!game) {
    return (
      <div className="rounded-2xl bg-slate-900 p-6 text-center text-slate-300">
        Preparando Entre Quatro Cores...
      </div>
    );
  }

  const isLocalTurn = game.currentPlayerId === state.playerId;
  const playableCardIds = new Set(
    game.hand.filter((card) => isPlayable(card, game)).map((card) => card.id)
  );
  const localPlayer = game.players.find((player) => player.playerId === state.playerId);
  const currentPlayer = game.players.find((player) => player.playerId === game.currentPlayerId);
  const pendingColorForLocal = game.pendingColorChoice?.playerId === state.playerId;
  const pendingHandSwapForLocal = game.pendingHandSwap?.playerId === state.playerId;
  const pendingHandSwapPlayer = game.pendingHandSwap
    ? game.players.find((player) => player.playerId === game.pendingHandSwap?.playerId)
    : undefined;
  const actionAnimation = game.lastAction?.includes("comprou")
    ? "four-colors-draw-pulse"
    : game.lastAction?.includes("apertou 1")
      ? "four-colors-uno-pop"
      : game.lastAction?.includes("carta especial")
        ? "four-colors-special-flash"
        : "";
  const tableAnimation = game.lastAction?.includes("apertou 1")
    ? "four-colors-table-uno"
    : game.lastAction?.includes("carta especial")
      ? "four-colors-table-special"
      : "";
  const mustDrawBeforePassing =
    isLocalTurn &&
    !game.canPass &&
    !game.pendingColorChoice &&
    !game.pendingHandSwap &&
    !game.pendingDrawAmount &&
    playableCardIds.size === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Sala {state.code}</p>
          <h1 className="text-2xl font-bold">Entre Quatro Cores</h1>
        </div>
      </header>

      <TurnIndicator
        state={state}
        currentPlayerId={game.currentPlayerId}
        direction={game.direction}
      />

      {game.lastAction && (
        <p className={`rounded-lg bg-slate-900 px-4 py-3 text-center text-sm text-slate-300 ${actionAnimation}`}>
          {game.lastAction}
        </p>
      )}

      <div className={`rounded-[3rem] border border-emerald-300/20 bg-emerald-950/60 p-4 shadow-2xl shadow-emerald-950/40 md:p-6 ${tableAnimation}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-2xl border border-amber-300/40 bg-amber-950/40 px-4 py-3 shadow-lg">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200/80">Vez de</p>
            <p className="text-lg font-black text-amber-100">{currentPlayer?.name ?? "Jogador"}</p>
          </div>
          {game.pendingDrawAmount ? (
            <p className="rounded-2xl border border-rose-300/40 bg-rose-950/50 px-4 py-3 text-sm font-semibold text-rose-100">
              {drawStackLabel(game)}
            </p>
          ) : null}
        </div>

        <PlayerList
          game={game}
          localPlayerId={state.playerId}
          onChallenge={fourColorsChallengeOne}
        />

        <div className="my-6 grid items-center gap-6 rounded-[2.5rem] border border-emerald-300/20 bg-emerald-900/30 p-6 shadow-inner md:grid-cols-[1fr_auto_auto_auto_1fr]">
          <div className="flex justify-center md:justify-end">
            <DeckPile
              disabled={!isLocalTurn || !!game.pendingColorChoice || !!game.pendingHandSwap}
              canPass={game.canPass}
              passHint={mustDrawBeforePassing ? "Compre 1 carta antes de passar." : undefined}
              onDraw={fourColorsDrawCard}
              onPass={fourColorsPassTurn}
            />
          </div>
          <div className="h-24 w-px bg-emerald-200/20 max-md:hidden" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-emerald-100/70">Botão 1</span>
            <OneButton
              disabled={localPlayer?.cardCount !== 1 || localPlayer?.hasCalledOne === true}
              onClick={fourColorsCallOne}
            />
            {localPlayer?.cardCount === 1 && !localPlayer.hasCalledOne && (
              <span className="four-colors-uno-warning text-xs font-bold text-amber-300">
                2s para pedir 1
              </span>
            )}
          </div>
          <div className="h-24 w-px bg-emerald-200/20 max-md:hidden" />
          <div className="flex justify-center md:justify-start">
            <DiscardPile card={game.topDiscard} currentColor={game.currentColor} />
          </div>
        </div>
      </div>

      {game.pendingColorChoice && !pendingColorForLocal && (
        <p className="rounded-lg bg-amber-900/40 px-4 py-3 text-center text-amber-100">
          Aguardando escolha da próxima cor...
        </p>
      )}

      {game.pendingHandSwap && !pendingHandSwapForLocal && (
        <p className="rounded-lg bg-amber-900/40 px-4 py-3 text-center text-amber-100">
          Aguardando {pendingHandSwapPlayer?.name ?? "jogador"} resolver a troca de mão...
        </p>
      )}

      {pendingHandSwapForLocal && (
        <section className="rounded-2xl border border-indigo-300/30 bg-indigo-950/50 p-5 shadow-xl">
          <h2 className="text-lg font-bold">Carta 0: trocar mão?</h2>
          <p className="mt-1 text-sm text-indigo-100/80">
            Escolha um jogador para trocar todas as cartas da mão ou ignore para continuar a partida.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {game.players
              .filter((player) => player.playerId !== state.playerId)
              .map((player) => (
                <button
                  key={player.playerId}
                  type="button"
                  onClick={() => fourColorsChooseHandSwapTarget(player.playerId)}
                  className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-bold hover:bg-indigo-400"
                >
                  Trocar com {player.name}
                </button>
              ))}
            <button
              type="button"
              onClick={() => fourColorsChooseHandSwapTarget()}
              className="rounded-full bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-slate-600"
            >
              Ignorar troca
            </button>
          </div>
        </section>
      )}

      <PlayerHand
        cards={game.hand}
        playableCardIds={playableCardIds}
        isTurn={isLocalTurn && !game.pendingColorChoice && !game.pendingHandSwap}
        onPlayCard={fourColorsPlayCard}
      />

      <ColorPickerModal open={pendingColorForLocal} onChoose={fourColorsChooseColor} />
    </div>
  );
}
