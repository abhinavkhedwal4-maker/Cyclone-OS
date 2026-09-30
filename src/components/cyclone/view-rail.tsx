import { Activity, CloudRain, Radar, Satellite, Siren, TowerControl, Waves } from "lucide-react";
import { VIEWS } from "@/lib/cyclone/views";
import type { ViewId } from "@/lib/cyclone/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ViewId, typeof Radar> = {
  overview: Radar,
  surge: Waves,
  rain: CloudRain,
  assets: TowerControl,
  advisory: Siren,
  gee: Satellite,
};

type Props = { view: ViewId; onView: (id: ViewId) => void };

export function ViewRail({ view, onView }: Props) {
  return (
    <nav
      aria-label="Dashboard views"
      className="relative z-10 flex gap-1 border-border bg-bg/40 p-1.5 max-md:order-3 max-md:flex-row max-md:justify-around max-md:border-t md:flex-col md:border-r md:p-2"
    >
      {VIEWS.map((v) => {
        const Icon = ICONS[v.id] ?? Activity;
        const on = view === v.id;
        return (
          <button
            key={v.id}
            type="button"
            aria-current={on}
            onClick={() => onView(v.id)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 font-display text-[9px] tracking-[0.16em] text-muted uppercase transition-[color,background,box-shadow,transform] duration-150 ease-out md:min-h-16",
              "active:scale-[0.96]",
              on
                ? "bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgb(62_200_255_/_0.35),0_0_24px_-6px_rgb(62_200_255_/_0.55)]"
                : "hover:bg-fg/5 hover:text-fg",
            )}
          >
            <Icon className="size-5" strokeWidth={1.7} />
            {v.label}
          </button>
        );
      })}
    </nav>
  );
}
