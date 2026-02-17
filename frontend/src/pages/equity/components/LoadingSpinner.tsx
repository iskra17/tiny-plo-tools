/* ═══ LoadingSpinner — Calculating state indicator ═══ */

import { useT } from "../i18n.ts";

interface LoadingSpinnerProps {
  method: "exact" | "montecarlo";
}

export default function LoadingSpinner({ method }: LoadingSpinnerProps) {
  const t = useT();

  return (
    <div className="bg-slate-800 rounded border border-slate-700 py-7 px-5 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-[3px] border-blue-500/25 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-slate-400 text-sm font-semibold">
        {method === "exact" ? t.calc.exactCalc : t.calc.mcCalc}
      </span>
    </div>
  );
}
