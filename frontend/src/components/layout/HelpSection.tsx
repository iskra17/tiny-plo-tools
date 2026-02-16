import { useState } from 'react';
import { HELP_ITEMS, getHelpLang, setHelpLang } from './helpContent';
import type { HelpLang } from './helpContent';

export function HelpSection() {
  const [lang, setLang] = useState<HelpLang>(getHelpLang);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggleLang = () => {
    const next: HelpLang = lang === 'ko' ? 'en' : 'ko';
    setLang(next);
    setHelpLang(next);
  };

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-[40vh] pr-1">
      {/* Header with lang toggle */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-300">
          {lang === 'ko' ? 'Help / 도움말' : 'Help'}
        </span>
        <button
          onClick={toggleLang}
          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors cursor-pointer"
        >
          {lang === 'ko' ? 'EN' : '한'}
        </button>
      </div>

      {/* Accordion items */}
      {HELP_ITEMS.map((item) => {
        const isOpen = openIds.has(item.id);
        const title = lang === 'ko' ? item.titleKo : item.titleEn;
        const brief = lang === 'ko' ? item.briefKo : item.briefEn;
        const detailed = lang === 'ko' ? item.detailedKo : item.detailedEn;

        return (
          <div key={item.id} className="border-b border-slate-800 last:border-b-0">
            <button
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-1.5 w-full text-left py-1.5 px-1 rounded hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span className="text-xs text-slate-400 flex-shrink-0">
                {isOpen ? '▾' : '▸'}
              </span>
              <span className="text-[11px] text-slate-300 font-medium truncate">
                {title}
              </span>
              <span className="text-[10px] text-blue-400 ml-auto flex-shrink-0">
                {isOpen ? (lang === 'ko' ? '[접기]' : '[less]') : (lang === 'ko' ? '[더보기]' : '[more]')}
              </span>
            </button>

            {/* Brief always visible */}
            <p className="text-[10px] text-slate-500 pl-5 pb-1.5 leading-tight">
              {brief}
            </p>

            {/* Detailed when expanded */}
            {isOpen && (
              <div className="pl-5 pb-2 flex flex-col gap-1">
                {detailed.map((line, i) => (
                  <p key={i} className="text-[11px] text-slate-400 leading-snug">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
