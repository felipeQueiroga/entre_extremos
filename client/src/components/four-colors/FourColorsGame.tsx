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
  if (game.pendingColorChoice) return false;
  if (card.type === "wild" || card.type === "wildDraw4") return true;
  if (card.color === game.currentColor) return true;
  if (card.type !== "number" && card.type === game.currentType) return true;
  return card.type === "number" && game.currentType === "number" && card.value === game.currentValue;
}

export default function FourColorsGame({ state }: FourColorsGameProps) {
  const {
    fourColorsPlayCard,
    fourColorsDrawCard,
    fourColorsChooseColor,
    fourColorsCallOne,
    fourColorsChallengeOne,
    fourColorsPassTurn,
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
  const pendingColorForLocal = game.pendingColorChoice?.playerId === state.playerId;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Sala {state.code}</p>
          <h1 className="text-2xl font-bold">Entre Quatro Cores</h1>
        </div>
        <OneButton
          disabled={localPlayer?.cardCount !== 1 || localPlayer?.hasCalledOne === true}
          onClick={fourColorsCallOne}
        />
      </header>

      <TurnIndicator
        state={state}
        currentPlayerId={game.currentPlayerId}
        direction={game.direction}
      />

      {game.lastAction && (
        <p className="rounded-lg bg-slate-900 px-4 py-3 text-center text-sm text-slate-300">
          {game.lastAction}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
        <DiscardPile card={game.topDiscard} currentColor={game.currentColor} />
        <DeckPile
          deckCount={game.deckCount}
          disabled={!isLocalTurn || !!game.pendingColorChoice}
          canPass={game.canPass}
          onDraw={fourColorsDrawCard}
          onPass={fourColorsPassTurn}
        />
        <PlayerList
          game={game}
          localPlayerId={state.playerId}
          onChallenge={fourColorsChallengeOne}
        />
      </div>

      {game.pendingColorChoice && !pendingColorForLocal && (
        <p className="rounded-lg bg-amber-900/40 px-4 py-3 text-center text-amber-100">
          Aguardando escolha da próxima cor...
        </p>
      )}

      <PlayerHand
        cards={game.hand}
        playableCardIds={playableCardIds}
        isTurn={isLocalTurn && !game.pendingColorChoice}
        onPlayCard={fourColorsPlayCard}
      />

      <ColorPickerModal open={pendingColorForLocal} onChoose={fourColorsChooseColor} />
    </div>
  );
}
