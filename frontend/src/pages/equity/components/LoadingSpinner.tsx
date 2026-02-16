/* ═══ LoadingSpinner — Calculating state indicator ═══ */

import { useT } from "../i18n.ts";

interface LoadingSpinnerProps {
  method: "exact" | "montecarlo";
}

export default function LoadingSpinner({ method }: LoadingSpinnerProps) {
  const t = useT();

  return (
    <div className="bg-[rgba(15,12,41,0.85)] backdrop-blur-md rounded-xl py-7 px-5 border border-white/10 flex flex-col items-center gap-3.5">
      <div className="w-10 h-10 border-[3px] border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-slate-400 text-sm font-semibold">
        {method === "exact" ? t.calc.exactCalc : t.calc.mcCalc}
      </span>
    </div>
  );
}
