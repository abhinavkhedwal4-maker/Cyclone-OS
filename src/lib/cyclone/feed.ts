import { useCallback, useEffect, useMemo, useState } from "react";
import { demoSnapshot } from "./seed";
import { getSupabase } from "./supabase";
import type {
  Advisory,
  CycloneSnapshot,
  DispatchEvent,
  Infrastructure,
  Region,
  Storm,
  TelemetryReading,
  Zone,
} from "./types";

function asActions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

async function loadRemote(): Promise<CycloneSnapshot | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const [regions, storms, zones, infrastructure, telemetry, advisories, dispatches] =
    await Promise.all([
      sb.from("regions").select("*"),
      sb.from("storms").select("*").order("recorded_at", { ascending: false }),
      sb.from("zones").select("*"),
      sb.from("infrastructure").select("*"),
      sb.from("telemetry_readings").select("*").order("recorded_at", { ascending: false }),
      sb.from("advisories").select("*").order("created_at", { ascending: false }),
      sb.from("dispatch_log").select("*").order("dispatched_at", { ascending: false }),
    ]);
  if (regions.error || !regions.data?.length) return null;
  return {
    regions: regions.data as Region[],
    storms: (storms.data ?? []) as Storm[],
    zones: (zones.data ?? []) as Zone[],
    infrastructure: (infrastructure.data ?? []) as Infrastructure[],
    telemetry: (telemetry.data ?? []) as TelemetryReading[],
    advisories: ((advisories.data ?? []) as Advisory[]).map((a) => ({
      ...a,
      actions: asActions(a.actions),
    })),
    dispatches: (dispatches.data ?? []) as DispatchEvent[],
    source: "supabase",
  };
}

export function useCycloneFeed() {
  const [snap, setSnap] = useState<CycloneSnapshot>(demoSnapshot);
  const [status, setStatus] = useState<"demo" | "live" | "loading">("loading");

  const refresh = useCallback(async () => {
    try {
      const remote = await loadRemote();
      if (remote) {
        setSnap(remote);
        setStatus("live");
        return;
      }
    } catch {
      /* keep demo */
    }
    setSnap(demoSnapshot());
    setStatus("demo");
  }, []);

  useEffect(() => {
    void refresh();
    const sb = getSupabase();
    if (!sb) return;
    const channel = sb
      .channel("cyclone-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "storms" }, () => {
        void refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "advisories" }, () => {
        void refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatch_log" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [refresh]);

  const pushAdvisory = useCallback(async (row: Omit<Advisory, "id" | "created_at">) => {
    const local: Advisory = {
      ...row,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    setSnap((prev) => ({ ...prev, advisories: [local, ...prev.advisories] }));
    const sb = getSupabase();
    if (!sb) return local;
    const { data, error } = await sb
      .from("advisories")
      .insert({
        region_id: row.region_id,
        headline: row.headline,
        summary: row.summary,
        actions: row.actions,
        severity: row.severity,
        confidence: row.confidence,
        source: row.source,
      })
      .select()
      .single();
    if (error || !data) return local;
    const saved = { ...(data as Advisory), actions: asActions((data as Advisory).actions) };
    setSnap((prev) => ({
      ...prev,
      advisories: [saved, ...prev.advisories.filter((a) => a.id !== local.id)],
    }));
    return saved;
  }, []);

  const pushDispatch = useCallback(async (regionId: string, advisoryId: string | null) => {
    const local: DispatchEvent = {
      id: crypto.randomUUID(),
      region_id: regionId,
      advisory_id: advisoryId,
      dispatched_at: new Date().toISOString(),
    };
    setSnap((prev) => ({ ...prev, dispatches: [local, ...prev.dispatches] }));
    const sb = getSupabase();
    if (!sb) return local;
    const { data, error } = await sb
      .from("dispatch_log")
      .insert({ region_id: regionId, advisory_id: advisoryId })
      .select()
      .single();
    if (error || !data) return local;
    const saved = data as DispatchEvent;
    setSnap((prev) => ({
      ...prev,
      dispatches: [saved, ...prev.dispatches.filter((d) => d.id !== local.id)],
    }));
    return saved;
  }, []);

  return useMemo(
    () => ({ snap, status, refresh, pushAdvisory, pushDispatch }),
    [snap, status, refresh, pushAdvisory, pushDispatch],
  );
}
