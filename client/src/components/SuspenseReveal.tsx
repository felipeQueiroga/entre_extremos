import { useEffect, useState } from "react";
import GameDial from "./GameDial";

interface SuspenseRevealProps {
  leftLabel: string;
  rightLabel: string;
}

export default function SuspenseReveal({ leftLabel, rightLabel }: SuspenseRevealProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    setCountdown(3);
    const t1 = setTimeout(() => setCountdown(2), 1000);
    const t2 = setTimeout(() => setCountdown(1), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="space-y-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-center">
      <h2 className="text-xl font-semibold text-amber-200 animate-pulse">Revelando...</h2>
      <p className="text-4xl font-bold text-amber-100">{countdown > 0 ? countdown : "…"}</p>

      <div className="gauge-suspense-shake mx-auto max-w-md opacity-90">
        <GameDial
          pointerValue={50}
          revealed={false}
          disabled
          leftLabel={leftLabel}
          rightLabel={rightLabel}
        />
      </div>

      <div className="mx-auto h-1 max-w-xs overflow-hidden rounded-full bg-slate-800">
        <div className="gauge-suspense-bar h-full bg-amber-500" />
      </div>
    </div>
  );
}
