import type { ClientPokerGameState, PokerVisiblePlayer } from "@entre-extremos/shared";
import PokerCard from "./PokerCard";
import PokerPlayerSeat from "./PokerPlayerSeat";
import { usePokerTableEffects } from "./usePokerTableEffects";

interface PokerTableProps {
  game: ClientPokerGameState;
  localPlayerId: string;
}

const PHASE_LABEL = {
  waiting: "Aguardando",
  preflop: "Pre-flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
  showdown: "Showdown",
  "hand-ended": "Mão encerrada",
} as const;

type SeatSlot = "bottom" | "top" | "top-left" | "top-right" | "left" | "right";

function rotatePlayersToLocalBottom(game: ClientPokerGameState, localPlayerId: string) {
  const localIndex = game.players.findIndex((player) => player.playerId === localPlayerId);
  if (localIndex < 0) return game.players;
  return [...game.players.slice(localIndex), ...game.players.slice(0, localIndex)];
}

function seatSlots(total: number): SeatSlot[] {
  switch (total) {
    case 1:
      return ["bottom"];
    case 2:
      return ["bottom", "top"];
    case 3:
      return ["bottom", "top-left", "top-right"];
    case 4:
      return ["bottom", "top", "left", "right"];
    case 5:
      return ["bottom", "top-left", "top", "top-right", "left"];
    case 6:
      return ["bottom", "top-left", "top", "top-right", "left", "right"];
    case 7:
      return ["bottom", "top-left", "top", "top-right", "left", "right", "top"];
    default:
      return ["bottom", "top-left", "top", "top-right", "left", "right", "top-left", "top-right"];
  }
}

function groupSeats(players: PokerVisiblePlayer[]) {
  const slots = seatSlots(players.length);
  const grouped: Record<SeatSlot, PokerVisiblePlayer[]> = {
    bottom: [],
    top: [],
    "top-left": [],
    "top-right": [],
    left: [],
    right: [],
  };

  players.forEach((player, index) => {
    const slot = slots[index] ?? "top";
    grouped[slot].push(player);
  });

  return grouped;
}

interface SeatProps {
  player: PokerVisiblePlayer;
  game: ClientPokerGameState;
  localPlayerId: string;
  winningCardIds: Set<string>;
  allInPlayerIds: Set<string>;
  currentPlayerId?: string;
}

function TableSeat({
  player,
  game,
  localPlayerId,
  winningCardIds,
  allInPlayerIds,
  currentPlayerId,
}: SeatProps) {
  const realIndex = game.players.findIndex((item) => item.playerId === player.playerId);
  const isTurn = !!currentPlayerId && player.playerId === currentPlayerId;
  return (
    <div className="w-[6.5rem] shrink-0 sm:w-[7rem]">
      <PokerPlayerSeat
        player={player}
        isCurrent={isTurn}
        isDealer={realIndex === game.dealerIndex}
        isLocal={player.playerId === localPlayerId}
        isWinner={(game.winners ?? []).includes(player.playerId)}
        winningCardIds={winningCardIds}
        animateAllIn={allInPlayerIds.has(player.playerId)}
        animateTurn={isTurn}
      />
    </div>
  );
}

export default function PokerTable({ game, localPlayerId }: PokerTableProps) {
  const { allInPlayerIds, revealedCardIndices, tableReveal, currentPlayerId } =
    usePokerTableEffects(game);
  const tablePlayers = rotatePlayersToLocalBottom(game, localPlayerId);
  const seats = groupSeats(tablePlayers);
  const winnerResults =
    game.handResults?.filter((result) => game.winners?.includes(result.playerId)) ?? [];
  const winningCardIds = new Set(winnerResults.flatMap((result) => result.cards.map((card) => card.id)));
  const winningHandLabels = [...new Set(winnerResults.map((result) => result.label))].filter(
    (label) => label !== "Venceu por desistência"
  );

  return (
    <section className="rounded-[1.5rem] border border-emerald-400/30 bg-[radial-gradient(circle_at_center,#17824b,#075f39_48%,#063320_78%)] p-2 shadow-2xl shadow-emerald-950/60 sm:p-3">
      <div className="relative rounded-[1.15rem] border-4 border-amber-900/60 p-2 sm:p-3">
        <div className="grid min-h-[24rem] grid-rows-[auto_minmax(0,1fr)_auto] gap-2 sm:min-h-[26rem] sm:gap-3">
          <div className="flex min-h-[5.5rem] items-end justify-center gap-2 px-1 sm:gap-3">
            {seats["top-left"].map((player) => (
              <TableSeat
                key={player.playerId}
                player={player}
                game={game}
                localPlayerId={localPlayerId}
                winningCardIds={winningCardIds}
                allInPlayerIds={allInPlayerIds}
                currentPlayerId={currentPlayerId}
              />
            ))}
            {seats.top.map((player) => (
              <TableSeat
                key={player.playerId}
                player={player}
                game={game}
                localPlayerId={localPlayerId}
                winningCardIds={winningCardIds}
                allInPlayerIds={allInPlayerIds}
                currentPlayerId={currentPlayerId}
              />
            ))}
            {seats["top-right"].map((player) => (
              <TableSeat
                key={player.playerId}
                player={player}
                game={game}
                localPlayerId={localPlayerId}
                winningCardIds={winningCardIds}
                allInPlayerIds={allInPlayerIds}
                currentPlayerId={currentPlayerId}
              />
            ))}
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center justify-center gap-2">
              {seats.left.map((player) => (
                <TableSeat
                  key={player.playerId}
                  player={player}
                  game={game}
                  localPlayerId={localPlayerId}
                  winningCardIds={winningCardIds}
                  allInPlayerIds={allInPlayerIds}
                  currentPlayerId={currentPlayerId}
                />
              ))}
            </div>

            <div
              className={`flex min-w-0 flex-col items-center justify-center gap-2 px-1 py-2 sm:gap-3 ${
                tableReveal ? "poker-table-reveal" : ""
              }`}
            >
              <div className="rounded-full border border-amber-200/30 bg-slate-950/60 px-4 py-1.5 text-center shadow-lg">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-amber-200">Pote</p>
                <p className="text-2xl font-black text-amber-100">{game.pot}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <PokerCard
                    key={index}
                    card={game.communityCards[index]}
                    hidden={!game.communityCards[index]}
                    reveal={revealedCardIndices.has(index)}
                    highlighted={
                      !!game.communityCards[index] && winningCardIds.has(game.communityCards[index].id)
                    }
                  />
                ))}
              </div>

              <div className="max-w-full text-center">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-100">
                  {PHASE_LABEL[game.phase]}
                </p>
                {winningHandLabels.length > 0 && (
                  <p className="mt-1 rounded-full bg-amber-300 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-950 sm:text-xs">
                    Mão vencedora: {winningHandLabels.join(" / ")}
                  </p>
                )}
                {game.lastAction && (
                  <p className="mt-1 line-clamp-2 text-[0.65rem] text-emerald-50/80 sm:text-xs">
                    {game.lastAction}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
              {seats.right.map((player) => (
                <TableSeat
                  key={player.playerId}
                  player={player}
                  game={game}
                  localPlayerId={localPlayerId}
                  winningCardIds={winningCardIds}
                  allInPlayerIds={allInPlayerIds}
                  currentPlayerId={currentPlayerId}
                />
              ))}
            </div>
          </div>

          <div className="flex min-h-[5.5rem] items-start justify-center gap-2 px-1 sm:gap-3">
            {seats.bottom.map((player) => (
              <TableSeat
                key={player.playerId}
                player={player}
                game={game}
                localPlayerId={localPlayerId}
                winningCardIds={winningCardIds}
                allInPlayerIds={allInPlayerIds}
                currentPlayerId={currentPlayerId}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
