/* ═══ LangToggle — Korean / English language switch ═══ */

import type { Lang } from "../types.ts";

interface LangToggleProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export default function LangToggle({ lang, setLang }: LangToggleProps) {
  return (
    <div className="flex gap-0.5 bg-white/[0.08] rounded-full p-0.5">
      <button
        onClick={() => setLang("ko")}
        className={`py-1 px-3 rounded-full border-none text-xs font-semibold cursor-pointer transition-all duration-150 ${
          lang === "ko"
            ? "bg-indigo-500/30 text-indigo-300"
            : "bg-transparent text-slate-500"
        }`}
      >
        한국어
      </button>
      <button
        onClick={() => setLang("en")}
        className={`py-1 px-3 rounded-full border-none text-xs font-semibold cursor-pointer transition-all duration-150 ${
          lang === "en"
            ? "bg-indigo-500/30 text-indigo-300"
            : "bg-transparent text-slate-500"
        }`}
      >
        English
      </button>
    </div>
  );
}
