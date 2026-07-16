// Team HQ hub: calendar, standings, roster, finances, league health.

import { useState } from 'preact/hooks';
import type { ChampionshipId, ClassId } from '../data/types';
import { classById, CLASSES } from '../data/classes';
import { DISCIPLINE_META } from '../data/brand';
import {
  riderStandingsFor, teamStandingsFor, saveCareer, seasonOver, runRound,
  type ApproachMap, type CareerState,
} from '../game/state';
import { ridersOfTeam } from '../data/universe';
import { NAMC_CLASS_IDS } from '../data/namc';
import { logRaceStart, logRaceEnd, exportTelemetry } from '../util/telemetry';
import { Logo } from './Logo';
import { IS_DEMO, DEMO_END_PITCH, LOCK_TAG } from './demo';
import type { WeekendResult } from '../sim/weekend';

interface Props {
  state: CareerState;
  onRaceReady: (weekends: WeekendResult[], playerWeekend: WeekendResult | null) => void;
  onExit: () => void;
  onViewDashboard?: () => void;
  onOpenShowroom?: () => void;
  onOpenGarage?: () => void;
  onOpenTraining?: () => void;
  onOpenPlaceholder?: (title: string, note?: string) => void;
  onRunOffSeason?: () => void;
}

type Tab = 'race' | 'standings' | 'team' | 'money' | 'league';

export function Hub({ state, onRaceReady, onExit, onViewDashboard, onOpenShowroom, onOpenGarage, onOpenTraining, onOpenPlaceholder, onRunOffSeason }: Props) {
  const [tab, setTab] = useState<Tab>('race');
  const [stClass, setStClass] = useState<ClassId>(state.focusClass);
  const [stChamp, setStChamp] = useState<ChampionshipId>(state.championship);
  const [approaches, setApproaches] = useState<ApproachMap>({});
  const [, bump] = useState(0);
  const u = state.universe;
  const team = u.teams[state.playerTeamId];
  const cal = u.calendars[state.discipline];
  const nextRound = state.round < cal.length ? cal[state.round] : null;
  const nextTrack = nextRound ? u.tracks[nextRound.trackId] : null;
  const myRiders = ridersOfTeam(u, team.id).filter(r => !r.bench);
  const meta = DISCIPLINE_META[state.discipline];

  const goRacing = () => {
    const cal = state.universe.calendars[state.discipline];
    const round = cal[state.round];

    // Log race start
    logRaceStart(state, state.round + 1, round.trackId);

    const { weekends, playerWeekend } = runRound(state, approaches);

    // Log race end
    logRaceEnd(state, weekends, playerWeekend);

    saveCareer(state);
    onRaceReady(weekends, playerWeekend);
  };

  const classOptions: { cls: ClassId; champ: ChampionshipId }[] =
    state.discipline === 'namc'
      ? (['fourStroke'] as ChampionshipId[]).flatMap(ch => NAMC_CLASS_IDS.map(cls => ({ cls, champ: ch })))
      : CLASSES.filter(c => c.discipline === state.discipline).map(c => ({ cls: c.id, champ: 'road' as ChampionshipId }));

  const downloadTelemetry = () => {
    const json = exportTelemetry();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paddock-boss-telemetry-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="screen">
      <div class="topbar">
        <Logo spec={team.logo} size={30} />
        <b>{team.name}</b>
        <span class="season-chip">{meta.short} &middot; {state.season}</span>
        <div class="grow" />
        <span class="money">${Math.round(team.budget).toLocaleString()}</span>
        <button class="ghost" onClick={downloadTelemetry} title="Export telemetry data for alpha testing">📊</button>
        <button class="ghost" onClick={onExit}>Menu</button>
      </div>
      <div class="tabs">
        {state.discipline === 'namc' && <button class="primary" onClick={onViewDashboard}>📊 Team Dashboard</button>}
        <button onClick={onOpenShowroom}>🏪 Showroom</button>
        <button onClick={onOpenGarage}>🔧 Garage</button>
        <button onClick={onOpenTraining}>🏋️ Training</button>
        <button class="ghost" onClick={() => onOpenPlaceholder?.(IS_DEMO ? 'R&D Center' + LOCK_TAG : 'R&D Center', IS_DEMO ? 'Bike design — Complexity, Power or Adaptability — is part of the full game. Your demo save carries over.' : 'Complexity / Power / Adaptability design philosophy, component budget allocation, designer risk. Opens at Round 15 per the design.')}>🧪 R&D{IS_DEMO ? ' 🔒' : ''}</button>
        <button class="ghost" onClick={() => onOpenPlaceholder?.(IS_DEMO ? 'Off-Season HQ' + LOCK_TAG : 'Off-Season HQ', IS_DEMO ? 'The Draft, Free Agency and multi-season careers are part of the full game. Your demo save carries over.' : 'Season review, the NAMC Draft (reverse standings, no pick trading), and the Free Agent Pool per rulebook 4.10-4.14. The sim runs it; this page makes it playable.')}>🗓️ Off-Season HQ{IS_DEMO ? ' 🔒' : ''}</button>
        <button class={tab === 'race' ? 'active' : ''} onClick={() => setTab('race')}>Race Weekend</button>
        <button class={tab === 'standings' ? 'active' : ''} onClick={() => setTab('standings')}>Standings</button>
        <button class={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>Team</button>
        <button class={tab === 'money' ? 'active' : ''} onClick={() => setTab('money')}>Finances</button>
        {state.discipline === 'namc' && <button class={tab === 'league' ? 'active' : ''} onClick={() => setTab('league')}>League Health</button>}
      </div>
      <div class="content scroll">
        {state.messages.length > 0 && tab === 'race' && (
          <div class="msg-banner">{state.messages[0]}</div>
        )}

        {tab === 'race' && (
          !seasonOver(state) && nextTrack ? (
            <>
              <div class="panel">
                <h3>Round {nextRound!.round} of {cal.length}</h3>
                <h2>{nextTrack.name}</h2>
                <p class="muted">{nextTrack.location} &middot; {nextTrack.kind === 'road' ? 'Road course' : nextTrack.kind === 'stadium' ? 'Stadium round' : 'Outdoor national'}</p>
              </div>
              <div class="panel">
                <h3>Rider approach — {classById(state.focusClass).name}</h3>
                {myRiders.filter(r => state.discipline !== 'namc' || r.classId === state.focusClass).map(r => (
                  <div class="row mb">
                    <span style="min-width:160px">#{r.number} {r.name} <span class="muted">OVR {r.overall}</span></span>
                    {(['conserve', 'normal', 'push'] as const).map(a => (
                      <button
                        class={(approaches[r.id] ?? 'normal') === a ? 'primary' : ''}
                        onClick={() => setApproaches({ ...approaches, [r.id]: a })}
                      >{a}</button>
                    ))}
                    {r.injuredForRounds > 0 && <span class="muted">INJURED ({r.injuredForRounds} rds)</span>}
                  </div>
                ))}
              </div>
              <div class="row">
                <button class="primary" onClick={goRacing}>🏁 Go Racing (watch live)</button>
              </div>
            </>
          ) : (
            IS_DEMO ? (
              <div class="panel">
                <h3>🏁 Demo season complete</h3>
                <p class="mb">{DEMO_END_PITCH}</p>
                <button class="primary" disabled title="Available in the full game">🗓️ Enter the Off-Season{LOCK_TAG}</button>
              </div>
            ) : (
              <div class="panel">
                <h3>Season complete</h3>
                <p class="mb">The {state.season} season is in the books. The off-season runs the full rulebook cycle: retirements, contract expiries, the NAMC Draft, then the Free Agent Pool.</p>
                <button class="primary" onClick={onRunOffSeason}>
                  🗓️ Enter the Off-Season
                </button>
              </div>
            )
          )
        )}

        {tab === 'standings' && (
          <>
            <div class="row mb" style="overflow-x:auto">
              {classOptions.map(({ cls, champ }) => (
                <button
                  class={stClass === cls && stChamp === champ ? 'primary' : ''}
                  onClick={() => { setStClass(cls); setStChamp(champ); }}
                >{state.discipline === 'namc' ? `${champ === 'fourStroke' ? '4S' : '2S'} ${classById(cls).shortName}` : classById(cls).shortName}</button>
              ))}
            </div>
            <div class="panel">
              <h3>Rider standings</h3>
              <table class="data">
                <thead><tr><th>#</th><th>Rider</th><th>Team</th><th style="text-align:right">Pts</th></tr></thead>
                <tbody>
                  {riderStandingsFor(state, stClass, stChamp).slice(0, 40).map((row, i) => {
                    const t = row.rider.teamId ? u.teams[row.rider.teamId] : null;
                    return (
                      <tr class={`${t?.id === team.id ? 'player' : ''} ${i === 0 ? 'p1' : ''}`}>
                        <td class="pos-badge">{i + 1}</td>
                        <td>#{row.rider.number} {row.rider.name}</td>
                        <td class="muted">{t?.shortName ?? '—'}</td>
                        <td style="text-align:right"><b>{row.pts}</b></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {state.discipline === 'namc' && (
              <div class="panel">
                <h3>Team championship — {stChamp === 'fourStroke' ? 'Four-Stroke' : 'Two-Stroke'}</h3>
                <table class="data">
                  <thead><tr><th>#</th><th>Team</th><th style="text-align:right">Pts</th></tr></thead>
                  <tbody>
                    {teamStandingsFor(state, stChamp).map((row, i) => (
                      <tr class={`${row.team.id === team.id ? 'player' : ''} ${i === 0 ? 'p1' : ''}`}>
                        <td class="pos-badge">{i + 1}</td>
                        <td>{row.team.name}{row.team.dualCharter ? ' ⬥' : ''}</td>
                        <td style="text-align:right"><b>{row.pts}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p class="muted" style="margin-top:6px">⬥ dual-charter: competes for recognition; prize money cascades to single-charter teams.</p>
              </div>
            )}
            {state.discipline === 'namc' && (
              <div class="panel">
                <h3>Tire Manufacturer Championship</h3>
                <table class="data">
                  <tbody>
                    {Object.entries(state.standings.tires).sort((a, b) => b[1] - a[1]).map(([brand, pts], i) => (
                      <tr class={i === 0 ? 'p1' : ''}>
                        <td class="pos-badge">{i + 1}</td>
                        <td>{u.tireBrands[brand]?.name ?? brand}</td>
                        <td style="text-align:right"><b>{pts}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'team' && (
          <>
            <div class="panel">
              <h3>Starters</h3>
              <table class="data">
                <thead><tr><th>Class</th><th>Rider</th><th>Age</th><th>OVR</th><th>Salary</th><th></th></tr></thead>
                <tbody>
                  {myRiders.sort((a, b) => (a.classId ?? '').localeCompare(b.classId ?? '')).map(r => (
                    <tr>
                      <td>{r.classId ? classById(r.classId).shortName : '—'}</td>
                      <td>#{r.number} {r.name}</td>
                      <td>{r.age}</td>
                      <td><b>{r.overall}</b></td>
                      <td class="muted">${r.salary.toLocaleString()}</td>
                      <td>{r.injuredForRounds > 0 ? `🏥 ${r.injuredForRounds}rds` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {state.discipline === 'namc' && (
              <div class="panel">
                <h3>Bench (reserve riders)</h3>
                <table class="data">
                  <tbody>
                    {ridersOfTeam(u, team.id).filter(r => r.bench).map(r => (
                      <tr><td>{r.name}</td><td>{r.isFemale ? 'F' : 'M'}</td><td>OVR {r.overall}</td><td class="muted">$50,000 retainer</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div class="panel">
              <h3>Bike — {u.manufacturers[team.manufacturerId]?.name}</h3>
              <p>Engine {team.bike.engine} &middot; Handling {team.bike.handling} &middot; Reliability {team.bike.reliability}</p>
              {state.discipline === 'namc' && <p class="muted">Tires: {u.tireBrands[team.tireBrandId]?.name} (season lock-in)</p>}
            </div>
          </>
        )}

        {tab === 'money' && (
          <div class="panel">
            <h3>Cash position</h3>
            <h2 class="money">${Math.round(team.budget).toLocaleString()}</h2>
            <p class="muted mb">Round-by-round income and payroll are settled automatically after each race weekend.</p>
            <table class="data">
              <thead><tr><th>Recent results</th><th>Winner</th><th>Your best</th></tr></thead>
              <tbody>
                {state.history.slice(0, 12).map(h => (
                  <tr><td>Round {h.round}</td><td>{h.winnerName}</td><td>{h.playerBest}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'league' && state.discipline === 'namc' && (
          <div class="panel">
            <h3>League Health — case study telemetry</h3>
            {state.leagueHealth.length === 0 ? (
              <p class="muted">Run a round to start collecting league financial data.</p>
            ) : (
              (() => {
                const latest = state.leagueHealth.slice(-2);
                return latest.map(lh => {
                  const totalPurse = lh.ledger.reduce((s, l) => s + l.purse, 0);
                  const totalPool = lh.ledger.reduce((s, l) => s + l.revenuePool, 0);
                  const totalSal = lh.ledger.reduce((s, l) => s + l.salaries, 0);
                  const insolvent = lh.ledger.filter(l => (u.teams[l.teamId]?.budget ?? 0) < 0).length;
                  return (
                    <div class="mb">
                      <h4>Round {lh.round} — {lh.championship === 'fourStroke' ? 'Four-Stroke' : 'Two-Stroke'}</h4>
                      <p class="muted">
                        Team purse credited: ${Math.round(totalPurse).toLocaleString()} &middot;
                        Revenue pool paid: ${Math.round(totalPool).toLocaleString()} &middot;
                        Payroll: ${Math.round(totalSal).toLocaleString()} &middot;
                        Teams under water: {insolvent}/20
                      </p>
                    </div>
                  );
                });
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
