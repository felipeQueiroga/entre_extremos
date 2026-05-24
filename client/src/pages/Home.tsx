import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GameMode } from "@entre-extremos/shared";
import { useGame } from "../hooks/GameContext";
import { getStoredName, saveSession } from "../utils/session";

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, error, clearError, connected } = useGame();
  const [name, setName] = useState(getStoredName());
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<GameMode>("couple");

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    clearError();
    try {
      const state = await createRoom(name.trim(), mode);
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

      {!connected && (
        <p className="mb-4 rounded-lg bg-amber-900/40 px-4 py-2 text-center text-amber-200">
          Conectando ao servidor...
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
          <label className="mb-2 block text-sm text-slate-400">Modo</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as GameMode)}
            className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
          >
            <option value="couple">Casal (2 jogadores)</option>
            <option value="teams">Times (vários jogadores)</option>
          </select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !connected || !name.trim()}
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
