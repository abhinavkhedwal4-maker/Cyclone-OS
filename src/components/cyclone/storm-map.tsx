import { useEffect, useState, type ComponentType } from "react";
import type { ImpactReport, Infrastructure, Region, Storm, ViewId, Zone } from "@/lib/cyclone/types";

type InnerProps = {
  region: Region;
  storm: Storm;
  zones: Zone[];
  infra: Infrastructure[];
  impact: ImpactReport;
  view: ViewId;
};

type Props = InnerProps & {
  kicker: string;
  title: string;
  sub: string;
};

export function StormMap(props: Props) {
  const [Inner, setInner] = useState<ComponentType<InnerProps> | null>(null);

  useEffect(() => {
    void import("./storm-map-inner").then((m) => setInner(() => m.StormMapInner));
  }, []);

  return (
    <section className="hud relative h-full min-h-0 overflow-hidden p-2">
      <div className="pointer-events-none absolute inset-0 z-10 radar-sweep mix-blend-screen" />
      <div className="pointer-events-none absolute top-4 left-4 z-20 max-w-[min(100%,28rem)]">
        <div className="mb-2 flex items-center gap-2 font-display text-[11px] tracking-[0.22em] text-accent uppercase">
          <span className="live-dot" />
          {props.kicker}
        </div>
        <h1 className="text-2xl leading-none font-semibold tracking-tight text-fg md:text-4xl">
          {props.title}
        </h1>
        <p className="mt-2 max-w-md font-display text-xs text-muted md:text-sm">{props.sub}</p>
      </div>
      <div className="h-full min-h-[240px] overflow-hidden rounded-[calc(var(--radius-lg)-8px)] md:min-h-0">
        {Inner ? (
          <Inner
            region={props.region}
            storm={props.storm}
            zones={props.zones}
            infra={props.infra}
            impact={props.impact}
            view={props.view}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-xs tracking-widest text-muted uppercase">
            Acquiring radar
          </div>
        )}
      </div>
    </section>
  );
}
