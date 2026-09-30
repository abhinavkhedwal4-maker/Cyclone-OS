import { Cpu, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generateAdvisory } from "@/lib/ai/generate-advisory";
import { composeAdvisory, formatPeople } from "@/lib/cyclone/model";
import type {
  Advisory,
  Audience,
  DispatchEvent,
  ImpactReport,
  Infrastructure,
  Region,
  Storm,
} from "@/lib/cyclone/types";

type Props = {
  region: Region;
  storm: Storm;
  impact: ImpactReport;
  infra: Infrastructure[];
  audience: Audience;
  onAudience: (v: Audience) => void;
  advisories: Advisory[];
  dispatches: DispatchEvent[];
  onCreate: (row: Omit<Advisory, "id" | "created_at">) => Promise<Advisory>;
  onDispatch: (regionId: string, advisoryId: string | null) => Promise<DispatchEvent>;
};

export function AdvisoryConsole({
  region,
  storm,
  impact,
  infra,
  audience,
  onAudience,
  advisories,
  dispatches,
  onCreate,
  onDispatch,
}: Props) {
  const floodedNames = infra
    .filter((a) => (impact.infraRisk[a.id] ?? 0) >= 0.45)
    .map((a) => a.name);
  const local = composeAdvisory({ region, storm, impact, audience, floodedNames });
  const [draft, setDraft] = useState(local);
  const [source, setSource] = useState("Deterministic model");
  const [busy, setBusy] = useState(false);

  const runAi = async () => {
    setBusy(true);
    try {
      const res = await generateAdvisory({
        data: {
          regionName: region.name,
          country: region.country,
          stormName: storm.name,
          wind: storm.wind_kmh,
          pressure: storm.pressure_hpa,
          rainfall: storm.rainfall_mm,
          etaHours: storm.eta_hours,
          waterM: impact.waterM,
          people: impact.peopleExposed,
          flooded: floodedNames.slice(0, 6).join(", ") || "none",
          severity: impact.severity,
          audience,
          confidence: storm.confidence,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        setDraft(local);
        setSource("Deterministic fallback");
        return;
      }
      setDraft(res.draft);
      setSource(res.draft.source);
      toast.success(`Drafted with ${res.draft.source}`);
    } catch {
      setDraft(local);
      setSource("Deterministic fallback");
      toast.error("AI desk unreachable — using the physics model");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const saved = await onCreate({
      region_id: region.id,
      headline: draft.headline,
      summary: draft.summary,
      actions: draft.actions,
      severity: draft.severity,
      confidence: draft.confidence,
      source,
    });
    await onDispatch(region.id, saved.id);
    toast.success("Advisory dispatched");
  };

  const mine = advisories.filter((a) => a.region_id === region.id);
  const logs = dispatches.filter((d) => d.region_id === region.id);

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto">
      <h2 className="m-0 font-display text-sm font-semibold">Advisory dispatch</h2>
      <div className="flex flex-wrap gap-2">
        <select
          value={audience}
          onChange={(e) => {
            const next = e.target.value as Audience;
            onAudience(next);
            setDraft(composeAdvisory({ region, storm, impact, audience: next, floodedNames }));
            setSource("Deterministic model");
          }}
          className="flex-1 rounded-lg bg-bg/60 px-2 py-2 font-display text-xs shadow-[var(--shadow-border)] outline-none"
        >
          <option value="municipal">Municipal commissioner</option>
          <option value="health">Health department</option>
          <option value="grid">Power utility</option>
        </select>
        <button
          type="button"
          onClick={() => void runAi()}
          disabled={busy}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent px-3 font-display text-xs font-semibold text-accent-fg active:scale-[0.96]"
        >
          {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Cpu className="size-3.5" />}
          Generate
        </button>
      </div>
      <pre className="max-h-48 overflow-auto rounded-[var(--radius-md)] bg-bg/70 p-3 font-display text-[11px] leading-relaxed whitespace-pre-wrap text-fg">
{`TO: ${audience.toUpperCase()}
REGION: ${region.name}, ${region.country}
HEADLINE: ${draft.headline}
${draft.summary}

ACTIONS:
${draft.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

SEVERITY ${draft.severity} · CONF ${Math.round(draft.confidence * 100)}% · ${source}
PEOPLE ${formatPeople(impact.peopleExposed)} · WATER ${impact.waterM.toFixed(1)} m`}
      </pre>
      <button
        type="button"
        onClick={() => void send()}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-warn px-4 font-display text-sm font-semibold text-accent-fg active:scale-[0.96]"
      >
        <Send className="size-4" /> Dispatch
      </button>
      <div>
        <h3 className="mb-1 font-display text-[11px] tracking-widest text-muted uppercase">Log</h3>
        <ul className="space-y-1 font-display text-[11px] text-muted">
          {logs.slice(0, 5).map((d) => (
            <li key={d.id} className="flex justify-between gap-2">
              <span>Sent {d.dispatched_at.slice(11, 16)} UTC</span>
              <span className="truncate text-fg">{mine.find((a) => a.id === d.advisory_id)?.headline ?? "bulletin"}</span>
            </li>
          ))}
          {logs.length === 0 && <li>No dispatches yet this watch.</li>}
        </ul>
      </div>
    </div>
  );
}
