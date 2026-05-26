interface OneButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export default function OneButton({ disabled, onClick }: OneButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border-4 border-white bg-amber-400 px-7 py-4 text-2xl font-black text-slate-950 shadow-xl shadow-amber-950/40 hover:scale-105 hover:bg-amber-300 disabled:scale-100 disabled:opacity-40"
    >
      1!
    </button>
  );
}
