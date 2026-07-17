import { cn } from "@/lib/utils";

const SESSION_CARD_TONES = [
  {
    idle:
      "border-2 border-blue-400/80 bg-gradient-to-br from-blue-50 to-sky-50/80 shadow-sm hover:border-blue-500 hover:shadow-md dark:border-blue-400/70 dark:from-blue-950/55 dark:to-slate-950/40 dark:hover:border-blue-300",
    selected:
      "border-2 border-blue-600 bg-gradient-to-br from-blue-100 to-sky-50 ring-2 ring-blue-500/40 shadow-md dark:border-blue-300 dark:from-blue-900/70 dark:to-blue-950/50 dark:ring-blue-400/50",
    accent: "text-blue-700 dark:text-blue-300",
    chip: "bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200",
    checkbox:
      "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300",
    checkboxSelected:
      "border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500 dark:text-slate-950",
  },
  {
    idle:
      "border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-50 to-teal-50/80 shadow-sm hover:border-emerald-500 hover:shadow-md dark:border-emerald-400/70 dark:from-emerald-950/55 dark:to-slate-950/40 dark:hover:border-emerald-300",
    selected:
      "border-2 border-emerald-600 bg-gradient-to-br from-emerald-100 to-teal-50 ring-2 ring-emerald-500/40 shadow-md dark:border-emerald-300 dark:from-emerald-900/70 dark:to-emerald-950/50 dark:ring-emerald-400/50",
    accent: "text-emerald-700 dark:text-emerald-300",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200",
    checkbox:
      "border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-300",
    checkboxSelected:
      "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-500 dark:text-slate-950",
  },
  {
    idle:
      "border-2 border-amber-400/80 bg-gradient-to-br from-amber-50 to-orange-50/70 shadow-sm hover:border-amber-500 hover:shadow-md dark:border-amber-400/70 dark:from-amber-950/45 dark:to-slate-950/40 dark:hover:border-amber-300",
    selected:
      "border-2 border-amber-600 bg-gradient-to-br from-amber-100 to-orange-50 ring-2 ring-amber-500/40 shadow-md dark:border-amber-300 dark:from-amber-900/60 dark:to-amber-950/45 dark:ring-amber-400/50",
    accent: "text-amber-800 dark:text-amber-300",
    chip: "bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200",
    checkbox:
      "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
    checkboxSelected:
      "border-amber-600 bg-amber-600 text-white dark:border-amber-400 dark:bg-amber-500 dark:text-slate-950",
  },
  {
    idle:
      "border-2 border-violet-400/80 bg-gradient-to-br from-violet-50 to-fuchsia-50/70 shadow-sm hover:border-violet-500 hover:shadow-md dark:border-violet-400/70 dark:from-violet-950/55 dark:to-slate-950/40 dark:hover:border-violet-300",
    selected:
      "border-2 border-violet-600 bg-gradient-to-br from-violet-100 to-fuchsia-50 ring-2 ring-violet-500/40 shadow-md dark:border-violet-300 dark:from-violet-900/70 dark:to-violet-950/50 dark:ring-violet-400/50",
    accent: "text-violet-700 dark:text-violet-300",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-900/70 dark:text-violet-200",
    checkbox:
      "border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-300",
    checkboxSelected:
      "border-violet-600 bg-violet-600 text-white dark:border-violet-400 dark:bg-violet-500 dark:text-slate-950",
  },
  {
    idle:
      "border-2 border-cyan-400/80 bg-gradient-to-br from-cyan-50 to-sky-50/80 shadow-sm hover:border-cyan-500 hover:shadow-md dark:border-cyan-400/70 dark:from-cyan-950/50 dark:to-slate-950/40 dark:hover:border-cyan-300",
    selected:
      "border-2 border-cyan-600 bg-gradient-to-br from-cyan-100 to-sky-50 ring-2 ring-cyan-500/40 shadow-md dark:border-cyan-300 dark:from-cyan-900/65 dark:to-cyan-950/50 dark:ring-cyan-400/50",
    accent: "text-cyan-700 dark:text-cyan-300",
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-200",
    checkbox:
      "border-cyan-500 text-cyan-600 dark:border-cyan-400 dark:text-cyan-300",
    checkboxSelected:
      "border-cyan-600 bg-cyan-600 text-white dark:border-cyan-400 dark:bg-cyan-500 dark:text-slate-950",
  },
] as const;

export function getSessionCardTone(index: number) {
  return SESSION_CARD_TONES[index % SESSION_CARD_TONES.length];
}

export function sessionCardClassName(index: number, selected: boolean, size: "md" | "sm" = "md") {
  const tone = getSessionCardTone(index);
  return cn(
    "rounded-xl border text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring snap-start shrink-0",
    size === "md"
      ? "w-[min(100%,22rem)] min-w-[18rem] max-w-[22rem]"
      : "min-w-[220px] max-w-[240px]",
    selected ? tone.selected : tone.idle,
  );
}

export function sessionCheckboxClassName(index: number, selected: boolean) {
  const tone = getSessionCardTone(index);
  return cn(
    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border shadow-sm",
    selected ? tone.checkboxSelected : tone.checkbox,
  );
}

export function sessionMetaClassName(index: number) {
  return getSessionCardTone(index).accent;
}

export function sessionTimeChipClassName(index: number) {
  return cn(
    "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
    getSessionCardTone(index).chip,
  );
}
