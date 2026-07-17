// Hub Screen — main game hub with 3 discipline bikes + navigation
// Layout: showroom (3 bikes) + overlay UI panel + bottom nav
// Mirrors Motorsport Manager reference design
// Integrates Hub functionality: race planning, standings, finances, league health

import { useState } from 'preact/hooks';
import type { ChampionshipId, ClassId } from '../data/types';
import type { CareerState, ApproachMap } from '../game/state';
import { classById, CLASSES } from '../data/classes';
import { DISCIPLINE_META } from '../data/brand';
import {
  riderStandingsFor, teamStandingsFor, runRound, seasonOver, saveCareer,
} from '../game/state';
import { ridersOfTeam } from '../data/universe';
import { NAMC_CLASS_IDS } from '../data/namc';
import { logRaceStart, logRaceEnd } from '../util/telemetry';
import { Logo } from './Logo';
import type { WeekendResult } from '../sim/weekend';
import './hub.css';

type PanelView = 'overview' | 'race' | 'standings' | 'team' | 'money' | 'league' | 'dashboard' | 'garage';

interface Props {
  state: CareerState;
  onRaceReady: (weekends: WeekendResult[], playerWeekend: WeekendResult | null) => void;
  onExit: () => void;
  onOpenShowroom: () => void;
  onOpenGarage: () => void;
  onOpenTraining: () => void;
  onOpenPlaceholder: (title: string, note?: string) => void;
  onRunOffSeason: () => void;
  onViewDashboard?: () => void;
}

export function HubScreen({
  state,
  onRaceReady,
  onExit,
  onOpenShowroom,
  onOpenGarage,
  onOpenTraining,
  onOpenPlaceholder,
  onRunOffSeason,
  onViewDashboard,
}: Props) {
  const [panel, setPanel] = useState<PanelView>('overview');
  const [stClass, setStClass] = useState<ClassId>(state.focusClass);
  const [stChamp, setStChamp] = useState<ChampionshipId>(state.championship);
  const [approaches, setApproaches] = useState<ApproachMap>({});

  const u = state.universe;
  const team = u.teams[state.playerTeamId];
  const cal = u.calendars[state.discipline];
  const nextRound = state.round < cal.length ? cal[state.round] : null;
  const nextTrack = nextRound ? u.tracks[nextRound.trackId] : null;
  const myRiders = ridersOfTeam(u, team.id).filter(r => !r.bench);
  const meta = DISCIPLINE_META[state.discipline];

  const goRacing = () => {
    logRaceStart(state, state.round + 1, nextRound!.trackId);
    const { weekends, playerWeekend } = runRound(state, approaches);
    logRaceEnd(state, weekends, playerWeekend);
    saveCareer(state);
    onRaceReady(weekends, playerWeekend);
  };

  const classOptions: { cls: ClassId; champ: ChampionshipId }[] =
    state.discipline === 'namc'
      ? (['fourStroke'] as ChampionshipId[]).flatMap(ch => NAMC_CLASS_IDS.map(cls => ({ cls, champ: ch })))
      : CLASSES.filter(c => c.discipline === state.discipline).map(c => ({ cls: c.id, champ: 'road' as ChampionshipId }));

  return (
    <div class="hub-screen">
      {/* Background Showroom with animated workers */}
      <div class="hub-background">
        <div class="showroom-gradient" />
        {/* TODO: UE5.7 worker animations piped via WebSocket */}
      </div>

      {/* Bike Display Area — reflects player's current discipline */}
      <div class="bikes-showcase">
        {(state.discipline === 'gp' || state.discipline === 'namc') && (
          <div class="bike-display supergp">
            <div class="bike-label">SuperGP</div>
            <div class="bike-icon">🏍️</div>
          </div>
        )}
        {(state.discipline === 'sbk' || state.discipline === 'namc') && (
          <div class="bike-display superbike">
            <div class="bike-label">Superbike</div>
            <div class="bike-icon">🏎️</div>
          </div>
        )}
        {state.discipline === 'namc' && (
          <div class="bike-display namc">
            <div class="bike-label">NAMC</div>
            <div class="bike-icon">🏁</div>
          </div>
        )}
      </div>

      {/* Right-side standings panel (always visible) */}
      <div class="standings-sidebar">
        <h4>Championship Leaders</h4>
        <div class="standings-mini">
          {riderStandingsFor(state, state.focusClass, state.championship).slice(0, 5).map((row, i) => (
            <div class="standing-row" key={i}>
              <span class="pos">{i + 1}</span>
              <span class="name">{row.rider.name.split(' ')[0]}</span>
              <span class="pts">{row.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content panel — context-sensitive overlay */}
      <div class="hub-panel">
        {/* Header with team info and metrics */}
        <div class="hub-header">
          <div class="team-badge">
            <Logo spec={team.logo} size={32} />
            <div class="team-info">
              <div class="team-name">{team.name}</div>
              <div class="season-chip">S{state.season} • R{state.round + 1}/{cal.length}</div>
            </div>
          </div>
          <div class="header-metrics">
            <div class="metric balance">
              <span class="label">Balance</span>
              <span class="value">${Math.round(team.budget / 1000)}k</span>
            </div>
            <div class="metric prestige">
              <span class="label">Prestige</span>
              <span class="value">{Math.round(team.prestige)}</span>
            </div>
            <div class="metric rd">
              <span class="label">R&D</span>
              <span class="value">Lv.{Math.round((team.bike.engine + team.bike.handling + team.bike.reliability) / 75)}</span>
            </div>
            <div class="metric sponsors">
              <span class="label">Sponsors</span>
              <span class="value">—</span>
            </div>
          </div>
          <button class="nav-exit" onClick={onExit}>✕</button>
        </div>

        {/* Quick nav buttons */}
        <div class="quick-nav">
          <button onClick={() => onViewDashboard?.()} class={panel === 'dashboard' ? 'active' : ''}>📊</button>
          <button onClick={() => onOpenShowroom()} class={panel === 'garage' ? 'active' : ''}>🛍️</button>
          <button onClick={() => onOpenGarage()} class={panel === 'garage' ? 'active' : ''}>🔧</button>
          <button onClick={() => onOpenTraining()}>🏋️</button>
          <button onClick={() => onOpenPlaceholder('R&D Center', 'Complexity / Power / Adaptability design.')}>🧪</button>
          <button onClick={() => setPanel('race')} class={panel === 'race' ? 'active' : ''}>🏁</button>
          <button onClick={() => setPanel('standings')} class={panel === 'standings' ? 'active' : ''}>📈</button>
          <button onClick={() => setPanel('team')} class={panel === 'team' ? 'active' : ''}>👥</button>
          <button onClick={() => setPanel('money')} class={panel === 'money' ? 'active' : ''}>💰</button>
          {state.discipline === 'namc' && <button onClick={() => setPanel('league')} class={panel === 'league' ? 'active' : ''}>🏛️</button>}
        </div>

        {/* Content panels */}
        <div class="panel-content scroll">
          {/* Race Planning */}
          {panel === 'race' && (
            <>
              {!seasonOver(state) && nextTrack ? (
                <>
                  <div class="section">
                    <h3>Round {nextRound!.round} — {nextTrack.name}</h3>
                    <p class="muted">{nextTrack.location} • {nextTrack.kind === 'stadium' ? 'Stadium' : 'Outdoor'}</p>
                  </div>
                  <div class="section">
                    <h4>Rider Approach</h4>
                    {myRiders.filter(r => state.discipline !== 'namc' || r.classId === state.focusClass).map(r => (
                      <div key={r.id} class="rider-approach">
                        <span class="rider-name">#{r.number} {r.name}</span>
                        <div class="approach-buttons">
                          {(['conserve', 'normal', 'push'] as const).map(a => (
                            <button
                              key={a}
                              class={`approach-btn ${(approaches[r.id] ?? 'normal') === a ? 'active' : ''}`}
                              onClick={() => setApproaches({ ...approaches, [r.id]: a })}
                            >{a}</button>
                          ))}
                        </div>
                        {r.injuredForRounds > 0 && <span class="injured">🏥 {r.injuredForRounds}rds</span>}
                      </div>
                    ))}
                  </div>
                  <button class="btn-race" onClick={goRacing}>🏁 GO RACING</button>
                </>
              ) : (
                <div class="section">
                  <h3>Season complete</h3>
                  <p>The {state.season} season is in the books. Run the off-season cycle.</p>
                  <button class="btn-primary" onClick={onRunOffSeason}>🗓️ Off-Season</button>
                </div>
              )}
            </>
          )}

          {/* Standings */}
          {panel === 'standings' && (
            <>
              <div class="class-filter">
                {classOptions.map(({ cls, champ }) => (
                  <button
                    key={cls}
                    class={stClass === cls && stChamp === champ ? 'active' : ''}
                    onClick={() => { setStClass(cls); setStChamp(champ); }}
                  >{state.discipline === 'namc' ? `${champ === 'fourStroke' ? '4S' : '2S'}` : ''} {classById(cls).shortName}</button>
                ))}
              </div>
              <table class="data standings">
                <thead><tr><th>#</th><th>Rider</th><th style="text-align:right">Pts</th></tr></thead>
                <tbody>
                  {riderStandingsFor(state, stClass, stChamp).slice(0, 20).map((row, i) => (
                    <tr key={row.rider.id} class={i === 0 ? 'leader' : ''}>
                      <td>{i + 1}</td>
                      <td>{row.rider.name}</td>
                      <td style="text-align:right"><b>{row.pts}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Team Roster */}
          {panel === 'team' && (
            <>
              <div class="section">
                <h4>Starters</h4>
                <table class="data">
                  <thead><tr><th>Rider</th><th>OVR</th><th>Age</th></tr></thead>
                  <tbody>
                    {myRiders.map(r => (
                      <tr key={r.id}>
                        <td>#{r.number} {r.name}</td>
                        <td>{r.overall}</td>
                        <td>{r.age}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Finances */}
          {panel === 'money' && (
            <div class="section">
              <h3 class="money">${Math.round(team.budget).toLocaleString()}</h3>
              <p class="muted">Round-by-round income settled after each race.</p>
              <table class="data">
                <thead><tr><th>Recent</th><th>Winner</th><th>Your Best</th></tr></thead>
                <tbody>
                  {state.history.slice(0, 6).map((h, i) => (
                    <tr key={i}><td>R{h.round}</td><td>{h.winnerName.split(' ')[0]}</td><td>{h.playerBest}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* League Health */}
          {panel === 'league' && state.discipline === 'namc' && (
            <div class="section">
              <h4>League Financial Health</h4>
              {state.leagueHealth.length === 0 ? (
                <p class="muted">Run a round to collect league data.</p>
              ) : (
                (() => {
                  const lh = state.leagueHealth[state.leagueHealth.length - 1];
                  const totalPurse = lh.ledger.reduce((s, l) => s + l.purse, 0);
                  return (
                    <p class="muted">
                      R{lh.round}: {lh.ledger.filter(l => (u.teams[l.teamId]?.budget ?? 0) < 0).length}/20 teams insolvent
                    </p>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
