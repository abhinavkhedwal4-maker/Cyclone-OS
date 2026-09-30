import { create } from "zustand";
import type { Audience, ViewId } from "./types";

type CycloneStore = {
  view: ViewId;
  regionId: string;
  surgeOverride: number | null;
  tide: number;
  audience: Audience;
  setView: (view: ViewId) => void;
  setRegionId: (id: string) => void;
  setSurgeOverride: (v: number | null) => void;
  setTide: (v: number) => void;
  setAudience: (v: Audience) => void;
};

export const useCycloneStore = create<CycloneStore>((set) => ({
  view: "overview",
  regionId: "kakinada-in",
  surgeOverride: null,
  tide: 0.6,
  audience: "municipal",
  setView: (view) => set({ view }),
  setRegionId: (regionId) => set({ regionId, surgeOverride: null }),
  setSurgeOverride: (surgeOverride) => set({ surgeOverride }),
  setTide: (tide) => set({ tide }),
  setAudience: (audience) => set({ audience }),
}));
