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
      className="rounded-full bg-amber-400 px-6 py-4 text-2xl font-black text-slate-950 shadow-lg hover:bg-amber-300 disabled:opacity-40"
    >
      1
    </button>
  );
}
