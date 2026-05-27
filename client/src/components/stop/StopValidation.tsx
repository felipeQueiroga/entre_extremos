import type { ClientStopGameState } from "@entre-extremos/shared";

interface StopValidationProps {
  game: ClientStopGameState;
  localPlayerId: string;
  onVote: (categoryId: string, answerOwnerId: string, valid: boolean) => void;
}

export default function StopValidation({ game, localPlayerId, onVote }: StopValidationProps) {
  const pending = game.pendingVotes;

  return (
    <section className="rounded-2xl border border-emerald-400/30 bg-slate-950/90 p-4 shadow-xl">
      <div className="mb-4 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Hora de validar</p>
        <h2 className="text-2xl font-black text-emerald-100">A maioria confirma?</h2>
        {game.stoppedByName && (
          <p className="mt-1 text-sm text-slate-400">{game.stoppedByName} gritou STOP.</p>
        )}
        {pending > 0 && (
          <p className="mt-2 text-sm text-amber-200">
            Faltam {pending} voto(s) seu(s) de {game.totalVotesRequired} possíveis.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {game.validationItems.map((item) => {
          const isOwn = item.answerOwnerId === localPlayerId;
          const voted = item.myVote !== undefined;
          const majority =
            item.majorityValid === true
              ? "Válido"
              : item.majorityValid === false
                ? "Inválido"
                : "Em votação";
          return (
            <article
              key={`${item.categoryId}-${item.answerOwnerId}`}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {game.categoryLabels[item.categoryId]}
                  </p>
                  <p className="font-bold text-slate-100">
                    {item.answerOwnerName}: <span className="text-amber-200">{item.answer}</span>
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    item.majorityValid
                      ? "bg-emerald-500/20 text-emerald-200"
                      : item.majorityValid === false
                        ? "bg-rose-500/20 text-rose-200"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {majority} ({item.validVotes}/{item.validVotes + item.invalidVotes})
                </span>
              </div>
              {!isOwn && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={voted}
                    onClick={() => onVote(item.categoryId, item.answerOwnerId, true)}
                    className="flex-1 rounded-lg bg-emerald-700 py-2 text-sm font-bold hover:bg-emerald-600 disabled:opacity-50"
                  >
                    Válido
                  </button>
                  <button
                    type="button"
                    disabled={voted}
                    onClick={() => onVote(item.categoryId, item.answerOwnerId, false)}
                    className="flex-1 rounded-lg bg-rose-800 py-2 text-sm font-bold hover:bg-rose-700 disabled:opacity-50"
                  >
                    Inválido
                  </button>
                </div>
              )}
              {isOwn && <p className="text-xs text-slate-500">Sua resposta — aguardando votos.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
