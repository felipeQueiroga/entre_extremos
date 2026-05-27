import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ClientRoomState } from "@entre-extremos/shared";
import { useGame } from "../hooks/GameContext";

export function useRoomRedirect(code: string | undefined) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useGame();

  useEffect(() => {
    if (!state || !code) return;
    if (state.code !== code.toUpperCase()) return;

    if (state.status === "playing") {
      navigate(`/game/${state.code}`, { replace: true });
    } else if (state.status === "finished") {
      navigate(`/game-over/${state.code}`, { replace: true });
    } else if (state.status === "lobby" && location.pathname.startsWith("/game/")) {
      navigate(`/lobby/${state.code}`, { replace: true });
    }
  }, [state, code, navigate, location.pathname]);
}

export function getPlayerName(state: ClientRoomState, playerId: string): string {
  return state.players.find((p) => p.id === playerId)?.name ?? "Jogador";
}

export function isPsychic(state: ClientRoomState): boolean {
  return state.currentRound?.psychicPlayerId === state.playerId;
}

export function isGuesser(state: ClientRoomState): boolean {
  const round = state.currentRound;
  if (!round) return false;
  if (state.mode === "couple") {
    return round.psychicPlayerId !== state.playerId;
  }
  const player = state.players.find((p) => p.id === state.playerId);
  return player?.team === round.activeTeam && round.psychicPlayerId !== state.playerId;
}

export function isOpponentTeam(state: ClientRoomState): boolean {
  const round = state.currentRound;
  if (!round?.activeTeam) return false;
  const player = state.players.find((p) => p.id === state.playerId);
  return player?.team !== undefined && player.team !== round.activeTeam;
}

export function isHost(state: ClientRoomState): boolean {
  return state.players.find((p) => p.id === state.playerId)?.isHost ?? false;
}
