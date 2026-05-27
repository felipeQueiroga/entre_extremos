import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CARD_THEME_OPTIONS, GAME_OPTIONS } from "@entre-extremos/shared";
import PlayerList from "../components/PlayerList";
import RoomChat from "../components/RoomChat";
import { useGame } from "../hooks/GameContext";
import { isHost, useRoomRedirect } from "../hooks/useGameHelpers";
import {
  getStoredPlayerId,
  getStoredPlayerName,
  getStoredRoomCode,
  saveSession,
} from "../utils/session";

const GAME_IMAGES = {
  "entre-extremos": "/images/ponteiro.png",
  "quatro-cores": "/images/entre_quatro_cores.png",
  "texas-holdem": "/images/poker.png",
} as const;

export default function Lobby() {
  const { code } = useParams();
  const { state, joinRoom, startGame, joinTeam, error, clearError } = useGame();
  const [copied, setCopied] = useState(false);

  useRoomRedirect(code);

  useEffect(() => {
    async function reconnect() {
      if (state?.code === code?.toUpperCase()) return;
      const storedCode = getStoredRoomCode();
      const storedId = getStoredPlayerId();
      const storedName = getStoredPlayerName();
      if (storedCode === code?.toUpperCase() && storedId && storedName) {
        try {
          const next = await joinRoom(code!, storedName, storedId);
          saveSession(next.playerId, storedName, next.code);
        } catch {
          /* handled by error state */
        }
      }
    }
    reconnect();
  }, [code, state, joinRoom]);

  if (!state || state.code !== code?.toUpperCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Carregando lobby...</p>
      </div>
    );
  }

  const connectedCount = state.players.filter((p) => p.connected).length;
  const themeLabels = state.cardThemes
    .map((theme) => CARD_THEME_OPTIONS.find((option) => option.id === theme)?.label)
    .filter(Boolean)
    .join(", ");
  const selectedGameLabel =
    GAME_OPTIONS.find((game) => game.id === state.selectedGame)?.label ?? "Entre Extremos";
  const canStart =
    state.selectedGame === "quatro-cores" || state.selectedGame === "texas-holdem"
      ? connectedCount >= 2
      : state.mode === "couple"
        ? connectedCount >= 2
        : connectedCount >= 2 &&
          state.players.some((p) => p.team === "A" && p.connected) &&
          state.players.some((p) => p.team === "B" && p.connected);

  async function copyCode() {
    if (!state) return;
    await navigator.clipboard.writeText(state.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Lobby</h1>
            <p className="mt-2 text-slate-400">Compartilhe o código com quem vai jogar</p>
            <div className="mx-auto mt-5 max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-left shadow-xl">
              <img
                src={GAME_IMAGES[state.selectedGame]}
                alt=""
                className="h-44 w-full object-cover"
                aria-hidden
              />
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">Jogo selecionado</p>
                <p className="mt-1 text-xl font-bold">{selectedGameLabel}</p>
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Jogo: {selectedGameLabel}
            </p>
            {state.selectedGame === "entre-extremos" && (
              <p className="mt-1 text-sm text-slate-500">
                Tema: {state.cardSource === "free" ? "Livre" : "Baralho"} · Modo:{" "}
                {state.mode === "couple" ? "Casal" : "Times"}
              </p>
            )}
            {state.selectedGame === "entre-extremos" && state.cardSource === "deck" && (
              <p className="mt-1 text-sm text-slate-500">
                Grupos: {themeLabels || "Relacionamento, Pets, Signos, Viagem, Primeiro encontro"}
              </p>
            )}
            {state.selectedGame === "texas-holdem" && (
              <p className="mt-1 text-sm text-slate-500">
                Fichas: {state.pokerOptions.startingChips} · Blinds: {state.pokerOptions.smallBlind}/
                {state.pokerOptions.bigBlind}
              </p>
            )}
          </header>

          {error && (
            <p className="mb-4 rounded-lg bg-rose-900/40 px-4 py-2 text-center text-rose-200">
              {error}
              <button type="button" onClick={clearError} className="ml-2 underline">
                ok
              </button>
            </p>
          )}

          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="rounded-xl bg-slate-800 px-6 py-4 text-3xl font-mono tracking-[0.4em]">
              {state.code}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold hover:bg-indigo-500"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Jogadores ({connectedCount})</h2>
            <PlayerList state={state} />
            {connectedCount < 2 && (
              <p className="mt-4 text-center text-slate-400">Aguardando segundo jogador...</p>
            )}
          </section>

          {state.selectedGame === "entre-extremos" && state.mode === "teams" && (
            <section className="mb-8 rounded-2xl bg-slate-900 p-6">
              <h2 className="mb-4 text-lg font-semibold">Escolha seu time</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => joinTeam("A")}
                  className="rounded-lg bg-sky-800 py-3 font-semibold hover:bg-sky-700"
                >
                  Time A
                </button>
                <button
                  type="button"
                  onClick={() => joinTeam("B")}
                  className="rounded-lg bg-rose-800 py-3 font-semibold hover:bg-rose-700"
                >
                  Time B
                </button>
              </div>
            </section>
          )}

          {isHost(state) && (
            <button
              type="button"
              onClick={() => startGame()}
              disabled={!canStart}
              className="w-full rounded-lg bg-emerald-600 py-4 text-lg font-semibold hover:bg-emerald-500 disabled:opacity-40"
            >
              Iniciar jogo
            </button>
          )}

          {!isHost(state) && (
            <p className="text-center text-slate-400">Aguardando o host iniciar a partida...</p>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:h-[min(400px,calc(100vh-4rem))]">
          <RoomChat />
        </aside>
      </div>
    </div>
  );
}
