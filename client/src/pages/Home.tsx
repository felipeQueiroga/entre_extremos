import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CARD_THEME_OPTIONS,
  DEFAULT_CARD_THEMES,
  GAME_OPTIONS,
  type CardSource,
  type CardTheme,
  type GameMode,
  type SelectedGame,
} from "@entre-extremos/shared";
import { useGame } from "../hooks/GameContext";
import { getStoredName, saveSession } from "../utils/session";

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, error, clearError, connected, connectionError } = useGame();
  const [name, setName] = useState(getStoredName());
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<SelectedGame>("entre-extremos");
  const [mode, setMode] = useState<GameMode>("couple");
  const [cardSource, setCardSource] = useState<CardSource>("deck");
  const [cardThemes, setCardThemes] = useState<CardTheme[]>([...DEFAULT_CARD_THEMES]);

  function toggleCardTheme(theme: CardTheme) {
    setCardThemes((current) =>
      current.includes(theme)
        ? current.filter((selected) => selected !== theme)
        : [...current, theme]
    );
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    clearError();
    try {
      const state = await createRoom(name.trim(), selectedGame, mode, cardSource, cardThemes);
      saveSession(state.playerId, name.trim(), state.code);
      navigate(`/lobby/${state.code}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    clearError();
    try {
      const state = await joinRoom(code.trim(), name.trim());
      saveSession(state.playerId, name.trim(), state.code);
      navigate(`/lobby/${state.code}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <header className="mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-400">Jogo online</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Entre Extremos</h1>
        <p className="mt-4 text-lg text-slate-300">
          Um jogo de pistas, interpretação e percepção. Um jogador recebe uma escala com dois
          conceitos opostos e precisa dar uma dica para que o parceiro descubra onde está o alvo
          secreto.
        </p>
      </header>

      {!connected && !connectionError && (
        <p className="mb-4 rounded-lg bg-amber-900/40 px-4 py-2 text-center text-amber-200">
          Conectando ao servidor...
        </p>
      )}

      {connectionError && (
        <p className="mb-4 rounded-lg bg-rose-900/40 px-4 py-2 text-center text-rose-200">
          {connectionError}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-rose-900/40 px-4 py-2 text-center text-rose-200">
          {error}
        </p>
      )}

      <section className="mb-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <h2 className="mb-4 text-xl font-semibold">Criar sala</h2>
          <label className="mb-2 block text-sm text-slate-400">Seu nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            placeholder="Como quer ser chamado?"
          />
          <label className="mb-2 block text-sm text-slate-400">Jogo</label>
          <div className="mb-4 grid gap-2">
            {GAME_OPTIONS.map((game) => (
              <label
                key={game.id}
                className={`cursor-pointer rounded-xl border px-4 py-3 ${
                  selectedGame === game.id
                    ? "border-indigo-500 bg-indigo-950/40"
                    : "border-slate-800 bg-slate-950"
                }`}
              >
                <input
                  type="radio"
                  name="selectedGame"
                  value={game.id}
                  checked={selectedGame === game.id}
                  onChange={() => setSelectedGame(game.id)}
                  className="sr-only"
                />
                <span className="block font-semibold">{game.label}</span>
                <span className="text-sm text-slate-400">{game.description}</span>
              </label>
            ))}
          </div>

          {selectedGame === "entre-extremos" && (
            <>
              <label className="mb-2 block text-sm text-slate-400">Modo</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as GameMode)}
                className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
              >
                <option value="couple">Casal (2 jogadores)</option>
                <option value="teams">Times (vários jogadores)</option>
              </select>
              <label className="mb-2 block text-sm text-slate-400">Tema da rodada</label>
              <select
                value={cardSource}
                onChange={(e) => setCardSource(e.target.value as CardSource)}
                className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
              >
                <option value="deck">Baralho (cartas sorteadas)</option>
                <option value="free">Livre (psíquico define o tema)</option>
              </select>
            </>
          )}

          {selectedGame === "entre-extremos" && cardSource === "deck" && (
            <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-300">Grupos de cartas</p>
                  <p className="text-xs text-slate-500">Escolha pelo menos um tema para a partida.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCardThemes(CARD_THEME_OPTIONS.map((theme) => theme.id))}
                  className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  Todos
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {CARD_THEME_OPTIONS.map((theme) => (
                  <label
                    key={theme.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:border-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={cardThemes.includes(theme.id)}
                      onChange={() => toggleCardTheme(theme.id)}
                      className="h-4 w-4 accent-indigo-500"
                    />
                    {theme.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={
              loading ||
              !connected ||
              !name.trim() ||
              (selectedGame === "entre-extremos" && cardSource === "deck" && cardThemes.length === 0)
            }
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-40"
          >
            Criar sala
          </button>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <h2 className="mb-4 text-xl font-semibold">Entrar na sala</h2>
          <label className="mb-2 block text-sm text-slate-400">Seu nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
            placeholder="Como quer ser chamado?"
          />
          <label className="mb-2 block text-sm text-slate-400">Código da sala</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 uppercase tracking-widest"
            placeholder="AB12CD"
            maxLength={6}
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={loading || !connected || !name.trim() || code.trim().length < 4}
            className="w-full rounded-lg bg-sky-600 py-3 font-semibold hover:bg-sky-500 disabled:opacity-40"
          >
            Entrar na sala
          </button>
        </div>
      </section>

      <section className="mb-8 rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
        <h2 className="mb-3 text-xl font-semibold">Regras</h2>
        <ul className="list-inside list-disc space-y-2 text-slate-300">
          <li>Dois extremos opostos formam uma escala de 0 a 100.</li>
          <li>O psíquico vê o alvo secreto e dá uma única dica.</li>
          <li>O parceiro posiciona o ponteiro onde acha que o alvo está.</li>
          <li>No modo times, o adversário aposta se o alvo está à esquerda ou direita.</li>
          <li>Primeiro a 10 pontos vence.</li>
        </ul>
      </section>

      <section className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
        <h2 className="mb-3 text-xl font-semibold">Pontuação</h2>
        <ul className="list-inside list-disc space-y-2 text-slate-300">
          <li>Distância até 4: 4 pontos</li>
          <li>Distância até 8: 3 pontos</li>
          <li>Distância até 12: 2 pontos</li>
          <li>Acima de 12: 0 pontos</li>
          <li>Modo times: adversário ganha +1 ao acertar a direção</li>
        </ul>
      </section>
    </div>
  );
}
