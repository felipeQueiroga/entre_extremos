import type { CardTheme, ClientStopGameState } from "@entre-extremos/shared";

interface StopFillGridProps {
  game: ClientStopGameState;
  onChange: (categoryId: CardTheme, value: string) => void;
  onStop: () => void;
}

export default function StopFillGrid({ game, onChange, onStop }: StopFillGridProps) {
  return (
    <section className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 p-4 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-violet-200">Preencha as categorias</p>
          <p className="text-sm text-violet-100/80">
            Todas as respostas devem começar com a letra sorteada.
          </p>
        </div>
        <div className="stop-letter-pulse flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-300 bg-amber-400 text-4xl font-black text-slate-950 shadow-lg shadow-amber-500/30">
          {game.letter}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {game.categories.map((categoryId) => {
          const value = game.myAnswers[categoryId] ?? "";
          const valid =
            value.trim().length > 0 &&
            value.trim()[0].toLocaleUpperCase("pt-BR") === game.letter.toLocaleUpperCase("pt-BR");
          return (
            <label
              key={categoryId}
              className={`rounded-xl border p-3 transition ${
                valid
                  ? "border-cyan-300/60 bg-violet-900/80"
                  : "border-violet-500/40 bg-violet-950/70"
              }`}
            >
              <span className="mb-2 block text-sm font-bold text-violet-50">
                {game.categoryLabels[categoryId]}
              </span>
              <input
                type="text"
                value={value}
                maxLength={80}
                onChange={(event) => onChange(categoryId, event.target.value)}
                placeholder={`${game.letter}...`}
                className="w-full rounded-lg border border-violet-400/30 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400"
              />
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-violet-100">
          {game.filledCount}/{game.categories.length} categorias válidas
        </p>
        <button
          type="button"
          onClick={onStop}
          disabled={!game.canStop}
          className="stop-call-flash rounded-xl bg-amber-400 px-6 py-3 text-lg font-black uppercase tracking-wider text-slate-950 hover:bg-amber-300 disabled:opacity-40"
        >
          Stop!
        </button>
      </div>
    </section>
  );
}
