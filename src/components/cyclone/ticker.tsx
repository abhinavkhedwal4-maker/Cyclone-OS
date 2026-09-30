export function Ticker({ line }: { line: string }) {
  const doubled = `${line}   //   ${line}   //   `;
  return (
    <div className="relative z-10 mx-3 mb-3 flex items-center gap-3 overflow-hidden rounded-[var(--radius-md)] px-3 py-2 hud">
      <strong className="shrink-0 font-display text-[11px] tracking-widest text-accent uppercase">
        Doppler
      </strong>
      <div className="min-w-0 flex-1 overflow-hidden mask-[linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <span className="tick-track font-display text-[12px] text-muted">{doubled}</span>
      </div>
    </div>
  );
}
