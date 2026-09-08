export function PipelineMap() {
  return (
    <div className="w-full h-48 border border-border bg-surface/20 rounded-sm flex flex-col justify-between p-4 mb-4 font-mono text-[11px]">
      <div className="flex justify-between text-ink-muted">
        <span>INBOUND_SIGNAL</span>
        <span>EDGE_ROUTER</span>
        <span>TARGET_SCHEMA</span>
      </div>
      
      {/* Structural visual flow path */}
      <div className="relative w-full h-px bg-border my-auto flex justify-between items-center">
        <div className="w-1.5 h-1.5 rounded-full bg-ink-accent -translate-y-[2px]" />
        <div className="w-1.5 h-1.5 rounded-full bg-ink-primary -translate-y-[2px]" />
        <div className="w-1.5 h-1.5 rounded-full bg-ink-secondary -translate-y-[2px]" />
      </div>

      <div className="flex justify-between text-ink-primary">
        <span>cart_mutation</span>
        <span>evaluate_intent</span>
        <span>resolve_payload</span>
      </div>
    </div>
  );
}