/* ═══ LangToggle — Korean / English language switch ═══ */

import type { Lang } from "../types.ts";

interface LangToggleProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export default function LangToggle({ lang, setLang }: LangToggleProps) {
  return (
    <div className="flex gap-0.5 bg-slate-700 rounded p-0.5">
      <button
        onClick={() => setLang("ko")}
        className={`py-1 px-2.5 rounded border-none text-xs font-semibold cursor-pointer transition-all duration-150 ${
          lang === "ko"
            ? "bg-blue-600 text-white"
            : "bg-transparent text-slate-400 hover:text-slate-200"
        }`}
      >
        KO
      </button>
      <button
        onClick={() => setLang("en")}
        className={`py-1 px-2.5 rounded border-none text-xs font-semibold cursor-pointer transition-all duration-150 ${
          lang === "en"
            ? "bg-blue-600 text-white"
            : "bg-transparent text-slate-400 hover:text-slate-200"
        }`}
      >
        EN
      </button>
    </div>
  );
}
