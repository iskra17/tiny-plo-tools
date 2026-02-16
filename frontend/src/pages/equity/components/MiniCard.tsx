/* ═══ MiniCard — Card display component ═══ */

import type { CardStr, Suit } from "../types.ts";
import { SC, SBG, SS } from "../constants.ts";
import { useT } from "../i18n.ts";

interface MiniCardProps {
  card: CardStr | null;
  onRemove?: () => void;
  size?: "sm" | "md";
}

const SIZES = {
  sm: { w: 28, h: 38, f: 10, s: 9 },
  md: { w: 40, h: 56, f: 14, s: 13 },
} as const;

export default function MiniCard({ card, onRemove, size = "md" }: MiniCardProps) {
  const t = useT();
  if (!card) return null;

  const suit = card[1] as Suit;
  const sz = SIZES[size];

  return (
    <div
      onClick={onRemove}
      style={{
        width: sz.w,
        height: sz.h,
        border: `2px solid ${SC[suit]}33`,
        background: `linear-gradient(135deg, white, ${SBG[suit]})`,
      }}
      className={`rounded-md flex flex-col items-center justify-center shadow-sm select-none relative shrink-0 ${
        onRemove ? "cursor-pointer" : "cursor-default"
      }`}
      title={onRemove ? t.player.clickToRemove : ""}
    >
      <span
        style={{ fontSize: sz.f, color: SC[suit] }}
        className="font-bold leading-none"
      >
        {card[0]}
      </span>
      <span
        style={{ fontSize: sz.s, color: SC[suit] }}
        className="leading-none mt-px"
      >
        {SS[suit]}
      </span>
      {onRemove && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center opacity-80">
          x
        </div>
      )}
    </div>
  );
}
