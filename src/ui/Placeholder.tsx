// Placeholder screen — a linked page that isn't built yet. Every button in
// the game routes SOMEWHERE; this is the "under construction" somewhere.

export function Placeholder({ title, note, onBack }: { title: string; note?: string; onBack: () => void }) {
  return (
    <div class="screen">
      <div class="row mb" style="justify-content:space-between;align-items:center">
        <h2>{title}</h2>
        <button class="ghost" onClick={onBack}>← Back to HQ</button>
      </div>
      <div class="panel" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;gap:10px">
        <div style="font-size:56px">🚧</div>
        <div style="font-weight:700;font-size:18px">{title} is under construction</div>
        <div class="muted" style="max-width:420px;text-align:center">{note ?? 'This page is on the build schedule. The link works — the room is being furnished.'}</div>
      </div>
    </div>
  );
}
