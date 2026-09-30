import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: LandingPage });

const FEATURES = [
  {
    icon: "🌀",
    title: "Live Storm Tracking",
    desc: "Real-time ensemble tracks, cone-of-uncertainty and ETA countdown for Bay of Bengal cyclones.",
  },
  {
    icon: "🛰️",
    title: "GEE Satellite Analytics",
    desc: "Sentinel-1 flood proxy and GPM rainfall ingested from Google Earth Engine into your dashboard.",
  },
  {
    icon: "⚡",
    title: "Infrastructure Exposure",
    desc: "Power grids, roads and medical facilities scored against the projected water-line in real time.",
  },
  {
    icon: "📡",
    title: "AI Advisory Dispatch",
    desc: "One-click advisory generation for municipal, health and grid teams with severity auto-scoring.",
  },
  {
    icon: "🌊",
    title: "Storm Surge Simulator",
    desc: "Drag the water line to model inundation scenarios — zones and assets recompute instantly.",
  },
  {
    icon: "🗺️",
    title: "CartoDB Dark Map",
    desc: "Zero-API-key satellite-aesthetic tile layer with Leaflet — no third-party key needed to run.",
  },
];

function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-bg text-fg">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -10%, rgb(62 200 255 / 0.13) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 80% 80%, rgb(62 224 164 / 0.07) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="scan pointer-events-none fixed inset-0 z-0"
        style={{ opacity: 0.04 }}
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="brand-ring shrink-0">
            <i />
          </div>
          <span className="font-display text-sm font-semibold tracking-wider text-fg">
            CYCLONE<span className="text-accent">OS</span>
          </span>
        </div>
        <Link
          to="/dashboard"
          className="font-display text-xs tracking-widest text-muted uppercase transition-colors hover:text-accent"
        >
          Dashboard →
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center md:px-10 md:py-28">
        <div className="mb-5 flex items-center gap-2 font-display text-[11px] tracking-[0.22em] text-accent uppercase">
          <span className="live-dot" />
          Bay of Bengal · Anticipatory Action Platform
        </div>

        <h1 className="max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-fg md:text-6xl">
          Act before landfall.
          <br />
          <span className="text-accent">Before the surge.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          CycloneOS is an open-source command centre for cyclone impact forecasting,
          satellite ingest and infrastructure vulnerability — built for coastal cities
          in the Bay of Bengal.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="hud inline-flex min-h-12 items-center gap-2.5 rounded-xl bg-accent/10 px-8 font-display text-sm font-semibold tracking-widest text-accent uppercase shadow-[0_0_0_1px_rgb(62_200_255/0.35),0_0_32px_-8px_rgb(62_200_255/0.25)] transition-all hover:bg-accent/20 hover:shadow-[0_0_0_1px_rgb(62_200_255/0.6),0_0_40px_-6px_rgb(62_200_255/0.35)]"
          >
            🚀 Launch Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl px-6 font-display text-sm tracking-wider text-muted transition-colors hover:text-fg"
          >
            View source ↗
          </a>
        </div>

        {/* Stat pills */}
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          {[
            { label: "Regions tracked", value: "6" },
            { label: "Storm models", value: "Live" },
            { label: "API keys required", value: "0" },
            { label: "GEE datasets", value: "3" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-0.5 rounded-xl bg-surface px-5 py-3 shadow-[var(--shadow-border)]"
            >
              <span className="font-display text-xl font-semibold text-accent">{s.value}</span>
              <span className="font-display text-[11px] tracking-widest text-muted uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Feature grid */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 md:px-10">
        <h2 className="mb-8 text-center font-display text-xs tracking-[0.2em] text-muted uppercase">
          Platform capabilities
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="hud flex flex-col gap-2.5 rounded-xl p-5 transition-all hover:shadow-[var(--shadow-border-hover)]"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-display text-sm font-semibold text-fg">{f.title}</h3>
              <p className="text-xs leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <div className="relative z-10 border-t border-border px-6 py-8 text-center md:px-10">
        <Link
          to="/dashboard"
          className="font-display text-sm tracking-widest text-accent uppercase transition-opacity hover:opacity-70"
        >
          Open the dashboard →
        </Link>
        <p className="mt-2 font-display text-[11px] text-muted">
          No login required · runs entirely in the browser
        </p>
      </div>
    </div>
  );
}
