export function TelemetryStream() {
  return (
    <div className="w-full border border-border bg-surface/10 rounded-sm p-4 font-mono text-[11px] space-y-2 text-ink-secondary">
      <div className="flex items-center justify-between border-b border-border/50 pb-2 text-ink-muted">
        <span>LIVE_TELEMETRY_STREAM</span>
        <span className="text-ink-accent animate-pulse">● active</span>
      </div>
      <div className="flex justify-between">
        <span className="text-ink-primary">✓ session.resolve</span>
        <span className="text-ink-muted">1.4ms</span>
      </div>
      <div className="flex justify-between">
        <span className="text-ink-primary">✓ payload.mutate_layout</span>
        <span className="text-ink-muted">2.1ms</span>
      </div>
      <div className="flex justify-between">
        <span className="text-ink-muted">i dynamic_pricing_hold</span>
        <span className="text-ink-muted">0.8ms</span>
      </div>
    </div>
  );
}