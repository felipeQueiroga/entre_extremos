import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CARD_THEME_OPTIONS,
  DEFAULT_CARD_THEMES,
  GAME_OPTIONS,
  type CardSource,
  type CardTheme,
  type GameMode,
  type PokerOptions,
  type SelectedGame,
} from "@entre-extremos/shared";
import { useGame } from "../hooks/GameContext";
import { getStoredName, saveSession } from "../utils/session";

const GAME_IMAGES: Record<SelectedGame, string> = {
  "entre-extremos": "/images/ponteiro.png",
  "quatro-cores": "/images/entre_quatro_cores.png",
  "texas-holdem": "/images/poker.png",
};

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, error, clearError, connected, connectionError } = useGame();
  const [name, setName] = useState(getStoredName());
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<SelectedGame>("entre-extremos");
  const [configGame, setConfigGame] = useState<SelectedGame | null>(null);
  const [mode, setMode] = useState<GameMode>("couple");
  const [cardSource, setCardSource] = useState<CardSource>("deck");
  const [cardThemes, setCardThemes] = useState<CardTheme[]>([...DEFAULT_CARD_THEMES]);
  const [zeroSwapEnabled, setZeroSwapEnabled] = useState(false);
  const [pokerOptions, setPokerOptions] = useState<PokerOptions>({
    startingChips: 1000,
    smallBlind: 10,
    bigBlind: 20,
  });

  function toggleCardTheme(theme: CardTheme) {
    setCardThemes((current) =>
      current.includes(theme)
        ? current.filter((selected) => selected !== theme)
        : [...current, theme]
    );
  }

  function openGameSettings(game: SelectedGame) {
    if (!name.trim()) return;
    setSelectedGame(game);
    setConfigGame(game);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    clearError();
    try {
      const state = await createRoom(
        name.trim(),
        selectedGame,
        mode,
        cardSource,
        cardThemes,
        { zeroSwapEnabled },
        pokerOptions
      );
      saveSession(state.playerId, name.trim(), state.code);
      setConfigGame(null);
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
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-400">Jogos online</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Se divirtam!!!</h1>
        <p className="mt-4 text-lg text-slate-300">
          Reuna seus amigos em uma sala e escolha entre jogos coletivos leves, caóticos e
          divertidos. Cada partida foi feita para render risadas, blefes, palpites improváveis e
          bons momentos juntos.
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

      <section className="mb-6 rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
        <p className="text-sm uppercase tracking-[0.25em] text-indigo-300">Primeiro passo</p>
        <h2 className="mt-1 text-2xl font-bold">Como você quer aparecer no jogo?</h2>
        <label className="mt-5 mb-2 block text-sm text-slate-400">Seu nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3"
          placeholder="Como quer ser chamado?"
          autoFocus
        />
        {!name.trim() && (
          <p className="mt-2 text-sm text-amber-200">
            Informe seu nome para criar ou se juntar a uma sala.
          </p>
        )}
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <h2 className="mb-1 text-xl font-semibold">Escolha um jogo</h2>
          <p className="mb-4 text-sm text-slate-400">
            Ao selecionar um jogo, você configura a partida antes de criar a sala.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {GAME_OPTIONS.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => openGameSettings(game.id)}
                disabled={!name.trim() || loading || !connected}
                className={`group overflow-hidden rounded-2xl border text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedGame === game.id
                    ? "border-indigo-400 bg-indigo-950/50 shadow-lg shadow-indigo-950/40"
                    : "border-slate-800 bg-slate-950 hover:border-slate-600"
                }`}
              >
                <img
                  src={GAME_IMAGES[game.id]}
                  alt=""
                  className="h-36 w-full object-cover transition group-hover:scale-105"
                  aria-hidden
                />
                <span className="block p-4">
                  <span className="block text-lg font-bold">{game.label}</span>
                  <span className="mt-1 block text-sm text-slate-400">{game.description}</span>
                  <span className="mt-3 inline-block rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold">
                    Configurar partida
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <h2 className="mb-4 text-xl font-semibold">Se juntar a uma sala</h2>
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
            Se juntar a sala
          </button>
        </div>
      </section>

      {configGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-indigo-300">Configurar jogo</p>
                <h2 className="mt-1 text-2xl font-bold">
                  {GAME_OPTIONS.find((game) => game.id === configGame)?.label}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setConfigGame(null)}
                className="rounded-full bg-slate-800 px-3 py-1 text-sm font-bold hover:bg-slate-700"
                aria-label="Fechar configurações"
              >
                X
              </button>
            </div>

            {configGame === "entre-extremos" && (
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

            {configGame === "quatro-cores" && (
              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">Opções do Entre Quatro Cores</p>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300 hover:border-slate-600">
                  <input
                    type="checkbox"
                    checked={zeroSwapEnabled}
                    onChange={(event) => setZeroSwapEnabled(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-indigo-500"
                  />
                  <span>
                    <span className="block font-semibold">
                      Carta 0 habilita troca de mão com outro jogador
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Quem jogar uma carta 0 pode escolher um adversário para trocar a mão ou ignorar.
                    </span>
                  </span>
                </label>
              </div>
            )}

            {configGame === "texas-holdem" && (
              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">Opções do Poker</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm text-slate-400">
                    Fichas iniciais
                    <input
                      type="number"
                      min={200}
                      step={100}
                      value={pokerOptions.startingChips}
                      onChange={(event) =>
                        setPokerOptions((current) => ({
                          ...current,
                          startingChips: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    />
                  </label>
                  <label className="text-sm text-slate-400">
                    Small blind
                    <input
                      type="number"
                      min={1}
                      value={pokerOptions.smallBlind}
                      onChange={(event) =>
                        setPokerOptions((current) => ({
                          ...current,
                          smallBlind: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    />
                  </label>
                  <label className="text-sm text-slate-400">
                    Big blind
                    <input
                      type="number"
                      min={2}
                      value={pokerOptions.bigBlind}
                      onChange={(event) =>
                        setPokerOptions((current) => ({
                          ...current,
                          bigBlind: Number(event.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                    />
                  </label>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Fichas são virtuais e servem apenas para a partida casual.
                </p>
              </div>
            )}

            {configGame === "entre-extremos" && cardSource === "deck" && (
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

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConfigGame(null)}
                className="rounded-lg bg-slate-700 py-3 font-semibold hover:bg-slate-600"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={
                  loading ||
                  !connected ||
                  !name.trim() ||
                  (selectedGame === "entre-extremos" && cardSource === "deck" && cardThemes.length === 0) ||
                  (selectedGame === "texas-holdem" &&
                    (pokerOptions.startingChips < 200 ||
                      pokerOptions.smallBlind < 1 ||
                      pokerOptions.bigBlind <= pokerOptions.smallBlind))
                }
                className="rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-40"
              >
                Criar sala
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mb-8 rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
        <h2 className="mb-3 text-xl font-semibold">Como funciona</h2>
        <ul className="list-inside list-disc space-y-2 text-slate-300">
          <li>Informe seu nome para aparecer corretamente na sala.</li>
          <li>Escolha um jogo e configure as regras antes de criar a partida.</li>
          <li>Compartilhe o código da sala com os outros jogadores.</li>
          <li>Novos jogos poderão entrar nessa mesma tela no futuro.</li>
        </ul>
      </section>

      <section className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
        <h2 className="mb-3 text-xl font-semibold">Jogos disponíveis</h2>
        <ul className="list-inside list-disc space-y-2 text-slate-300">
          <li>Entre Extremos: pistas e palpites em uma escala secreta.</li>
          <li>Entre Quatro Cores: cartas, blefes, 1!, compras e troca de mãos opcional.</li>
          <li>Poker Texas Hold'em: apostas com fichas virtuais e cartas comunitárias.</li>
        </ul>
      </section>
    </div>
  );
}
