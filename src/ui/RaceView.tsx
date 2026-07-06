// Live race view: timing tower + event feed, replaying a simulated race
// lap-by-lap at selectable speed. Same data also supports instant results.

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Universe } from '../data/types';
import type { RaceOutcome } from '../sim/engine';

interface Props {
  u: Universe;
  title: string;
  outcome: RaceOutcome;
  playerTeamId: string;
  onDone: () => void;
}

export function RaceView({ u, title, outcome, playerTeamId, onDone }: Props) {
  const [lap, setLap] = useState(0);           // 0 .. laps
  const [speed, setSpeed] = useState(1);       // laps per tick
  const [running, setRunning] = useState(true);
  const timer = useRef<number | null>(null);

  const totalLaps = outcome.lapOrder.length;
  const finished = lap >= totalLaps;

  useEffect(() => {
    if (!running || finished) return;
    timer.current = window.setTimeout(() => setLap(l => Math.min(totalLaps, l + speed)), 900 / speed);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [lap, running, speed, finished, totalLaps]);

  const order = finished || lap === 0
    ? (finished ? outcome.rows.filter(r => r.status === 'finished').map(r => r.riderId) : outcome.lapOrder[0] ?? [])
    : outcome.lapOrder[Math.max(0, lap - 1)];

  const dnfSoFar = useMemo(() => {
    const s = new Set<string>();
    for (const ev of outcome.events) {
      if ((ev.kind === 'crash' || ev.kind === 'mechanical') && ev.lap <= lap) s.add(ev.riderId);
    }
    return s;
  }, [lap, outcome.events]);

  const feed = outcome.events.filter(e => e.lap <= lap).slice(-40);

  const gapFor = (riderId: string, idx: number): string => {
    if (idx === 0) return finished ? 'WINNER' : 'Leader';
    const li = Math.max(0, Math.min(lap, totalLaps) - 1);
    const leader = order[0];
    const a = outcome.lapTimes[leader]?.[li];
    const b = outcome.lapTimes[riderId]?.[li];
    if (a === undefined || b === undefined) return '';
    return `+${(b - a).toFixed(1)}`;
  };

  return (
    <div class="screen">
      <div class="race-layout">
        <div class="tower">
          {order.map((id, i) => {
            const r = u.riders[id];
            const t = r?.teamId ? u.teams[r.teamId] : null;
            if (!r || !t) return null;
            return (
              <div class={`tower-row ${i === 0 ? 'p1' : ''} ${t.id === playerTeamId ? 'player' : ''}`}>
                <span class="pos">{i + 1}</span>
                <span class="cbar" style={{ background: t.colors.primary }} />
                <span class="rname">#{r.number} {r.name}</span>
                <span class="gap">{gapFor(id, i)}</span>
              </div>
            );
          })}
          {[...dnfSoFar].map(id => {
            const r = u.riders[id];
            const t = r?.teamId ? u.teams[r.teamId] : null;
            if (!r || !t) return null;
            return (
              <div class="tower-row dnf">
                <span class="pos">–</span>
                <span class="cbar" style={{ background: t.colors.primary }} />
                <span class="rname">#{r.number} {r.name}</span>
                <span class="gap">OUT</span>
              </div>
            );
          })}
        </div>
        <div class="race-main">
          <div class="race-head">
            <div>
              <div style="font-weight:700">{title}</div>
              <div class="muted">{outcome.weather === 'wet' ? '🌧 WET RACE' : '☀ Dry'}</div>
            </div>
            <div class="spacer" />
            <div class="lap">{finished ? 'FINISH' : `LAP ${Math.min(lap + 1, totalLaps)}/${totalLaps}`}</div>
          </div>
          <div class="race-feed">
            {feed.slice().reverse().map(ev => (
              <div class={`feed-item ${ev.kind}`}>
                <b>L{ev.lap}</b> — {ev.text}
              </div>
            ))}
          </div>
          <div class="race-controls">
            {!finished ? (
              <>
                <button onClick={() => setRunning(!running)}>{running ? '⏸ Pause' : '▶ Resume'}</button>
                {[1, 2, 4].map(s => (
                  <button class={speed === s ? 'primary' : ''} onClick={() => setSpeed(s)}>{s}x</button>
                ))}
                <button onClick={() => setLap(totalLaps)}>⏭ Skip to result</button>
              </>
            ) : (
              <button class="primary" onClick={onDone}>Continue &rarr;</button>
            )}
            <div class="spacer" />
          </div>
        </div>
      </div>
    </div>
  );
}
