/* ═══ EmptySlot — Empty card placeholder ═══ */

interface EmptySlotProps {
  dark?: boolean;
}

export default function EmptySlot({ dark = true }: EmptySlotProps) {
  return (
    <div
      className={`w-10 h-14 rounded-md flex items-center justify-center text-lg shrink-0 ${
        dark
          ? "border-2 border-dashed border-white/15 text-slate-600"
          : "border-2 border-dashed border-black/15 text-slate-300"
      }`}
    >
      ?
    </div>
  );
}
