// Off-Season HQ — the playable end-of-season sequence (rulebook §4.10-4.14):
// Season Review → Retirements & Free Agency lockdown → THE DRAFT → the Free
// Agent window → into the new season. Data comes from the OffSeasonReport
// produced by advanceSeason(); this screen is the broadcast of it.

import { useState } from 'preact/hooks';
import type { CareerState, OffSeasonReport } from '../game/state';
import { classById } from '../data/classes';

const PHASES = ['Season Review', 'Retirements & Expiries', 'The NAMC Draft', 'Free Agency', 'New Season'] as const;

export function OffSeason({ state, report, onDone }: { state: CareerState; report: OffSeasonReport; onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const last = phase === PHASES.length - 1;
  const short = (c: string) => classById(c as any)?.shortName ?? c;

  return (
    <div class="screen">
      <div class="row mb" style="justify-content:space-between;align-items:center">
        <h2>🗓️ Off-Season — {report.endedSeason}</h2>
        <div class="row" style="gap:6px">
          {PHASES.map((p, i) => (
            <span class={i === phase ? 'season-chip' : 'muted'} style="font-size:11px">{p}</span>
          ))}
        </div>
      </div>

      <div class="panel scroll" style="min-height:60vh">
        {phase === 0 && (
          <>
            <h3>🏆 {report.endedSeason} Champions</h3>
            {report.champions.map(c => (
              <div class="row mb" style="justify-content:space-between">
                <span><b>{short(c.classId)}</b> — {c.rider} <span class="muted">({c.teamName})</span></span>
                <span>{c.pts} pts {c.titles > 1 ? `· title #${c.titles}` : ''} · runs <b>#1</b> next season</span>
              </div>
            ))}
            {report.teamTitle && (
              <p class="mb">🏭 Manufacturer's Cup: <b>{report.teamTitle.teamName}</b> — ${(report.teamTitle.prize / 1000).toFixed(0)}k team-title purse. Numbers reassigned by final standings (§6.1).</p>
            )}
          </>
        )}
        {phase === 1 && (
          <>
            <h3>👋 Retirements</h3>
            {report.retired.length === 0 && <p class="muted">Nobody hung it up this winter.</p>}
            {report.retired.map(r => <div class="mb">{r.name} retires at {r.age}{r.titles > 0 ? ` — ${r.titles}x champion` : ''}</div>)}
            <h3>📄 Out of contract → Free Agent Pool</h3>
            <p class="muted mb">Signing lockdown is in effect until Draft Day (§4.10). No team may contact these riders.</p>
            {report.toFreeAgency.map(r => <div class="mb">{r.name} <span class="muted">({short(r.classId)}, OVR {r.overall}) leaves {r.fromTeam}</span></div>)}
          </>
        )}
        {phase === 2 && (
          <>
            <h3>🎯 The NAMC Draft — two weeks before the opener</h3>
            <p class="muted mb">Reverse Manufacturer's Cup order. Picks are non-transferable (§4.10). Development Series rookies, OVR-vetted (§4.11).</p>
            {report.draftPicks.map((p, i) => (
              <div class="row mb" style={p.isPlayer ? 'color:#f39c12;font-weight:700' : ''}>
                <span style="min-width:32px">{i + 1}.</span>
                <span>{p.teamName} select <b>{p.rider}</b> <span class="muted">({short(p.classId)}, OVR {p.overall})</span></span>
              </div>
            ))}
            {report.draftPicks.length === 0 && <p class="muted">Full rosters league-wide — no picks exercised.</p>}
          </>
        )}
        {phase === 3 && (
          <>
            <h3>🤝 Free Agent Pool — opens the day after Draft Day (§4.12)</h3>
            {report.faSignings.map(f => (
              <div class="mb" style={f.isPlayer ? 'color:#f39c12;font-weight:700' : ''}>
                {f.rider} <span class="muted">({short(f.classId)}, OVR {f.overall})</span> signs with <b>{f.toTeam}</b>
              </div>
            ))}
            {report.faSignings.length === 0 && <p class="muted">No moves — every roster held.</p>}
            <p class="muted">{report.poolLeft} riders remain in the Pool at namcmotocross.com.</p>
          </>
        )}
        {phase === 4 && (
          <>
            <h3>🏁 The {state.season} season is here</h3>
            <p class="mb">Rosters are locked, numbers are earned, and the gate drops at {state.universe.tracks[state.universe.calendars[state.discipline][0].trackId]?.name}. New year, same dirt.</p>
          </>
        )}
      </div>

      <div class="row" style="justify-content:space-between;margin-top:10px">
        <button class="ghost" disabled={phase === 0} onClick={() => setPhase(p => Math.max(0, p - 1))}>← Back</button>
        {!last
          ? <button class="primary" onClick={() => setPhase(p => p + 1)}>Continue →</button>
          : <button class="primary" onClick={onDone}>Start the {state.season} Season 🏁</button>}
      </div>
    </div>
  );
}
