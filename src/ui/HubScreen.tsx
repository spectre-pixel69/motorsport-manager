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
type OverlayView = null | 'showroom' | 'garage' | 'training' | 'dashboard' | 'placeholder';

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
  const [overlay, setOverlay] = useState<OverlayView>(null);
  const [stClass, setStClass] = useState<ClassId>(state.focusClass);
  const [stChamp, setStChamp] = useState<ChampionshipId>(state.championship);
  const [approaches, setApproaches] = useState<ApproachMap>({});
  const [placeholderTitle, setPlaceholderTitle] = useState('');
  const [placeholderNote, setPlaceholderNote] = useState('');

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
          <button onClick={() => setOverlay('dashboard')} class={overlay === 'dashboard' ? 'active' : ''} title="Team Dashboard">📊</button>
          <button onClick={() => setOverlay('showroom')} class={overlay === 'showroom' ? 'active' : ''} title="Shop">🛍️</button>
          <button onClick={() => setOverlay('garage')} class={overlay === 'garage' ? 'active' : ''} title="Garage">🔧</button>
          <button onClick={() => setOverlay('training')} title="Training">🏋️</button>
          <button onClick={() => { setOverlay('placeholder'); setPlaceholderTitle('R&D Center'); setPlaceholderNote('Complexity / Power / Adaptability design.'); }}>🧪</button>
          <button onClick={() => setPanel('race')} class={panel === 'race' ? 'active' : ''} title="Race">🏁</button>
          <button onClick={() => setPanel('standings')} class={panel === 'standings' ? 'active' : ''} title="Standings">📈</button>
          <button onClick={() => setPanel('team')} class={panel === 'team' ? 'active' : ''} title="Team">👥</button>
          <button onClick={() => setPanel('money')} class={panel === 'money' ? 'active' : ''} title="Finances">💰</button>
          {state.discipline === 'namc' && <button onClick={() => setPanel('league')} class={panel === 'league' ? 'active' : ''} title="League">🏛️</button>}
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
          {panel === 'standings' && (() => {
            const standings = riderStandingsFor(state, stClass, stChamp);
            const leader = standings[0];
            const roundsRemaining = cal.length - state.round;
            const maxRemainingPoints = roundsRemaining * 75; // Main Event winner points
            return (
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

                {leader && (
                  <div class="panel" style="padding:12px;margin-bottom:12px;background:linear-gradient(135deg, #15192e 0%, #1a1f3a 100%)">
                    <div class="muted" style="font-size:11px">Championship Leader</div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <div>
                        <div style="font-size:18px;font-weight:bold">{leader.rider.name}</div>
                        <div class="muted" style="font-size:12px">{leader.rider.teamId ? u.teams[leader.rider.teamId]?.name : 'Free Agent'}</div>
                      </div>
                      <div style="text-align:right">
                        <div style="font-size:28px;font-weight:bold;color:#f39c12">{leader.pts} pts</div>
                        <div class="muted" style="font-size:11px">{roundsRemaining} rounds left</div>
                      </div>
                    </div>
                  </div>
                )}

                <table class="data standings">
                  <thead><tr><th>#</th><th>Rider / Team</th><th style="text-align:right">Pts</th><th style="text-align:center">Δ</th></tr></thead>
                  <tbody>
                    {standings.slice(0, 20).map((row, i) => {
                      const delta = leader ? Math.round(leader.pts - row.pts) : 0;
                      const canClench = delta <= maxRemainingPoints;
                      return (
                        <tr key={row.rider.id} class={i === 0 ? 'leader' : ''} style={!canClench ? 'opacity:0.6' : ''}>
                          <td>{i + 1}</td>
                          <td>
                            <div>{row.rider.name}</div>
                            <div class="muted" style="font-size:11px">{row.rider.teamId ? u.teams[row.rider.teamId]?.shortName : 'FA'}</div>
                          </td>
                          <td style="text-align:right"><b>{row.pts}</b></td>
                          <td style="text-align:center" class="muted">{delta > 0 ? `−${delta}` : 'Lead'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            );
          })()}

          {/* Team Roster */}
          {panel === 'team' && (() => {
            const allRiders = ridersOfTeam(u, team.id);
            const starters = allRiders.filter(r => !r.bench);
            const bench = allRiders.filter(r => r.bench);
            return (
              <>
                <div class="section">
                  <h4>Active Roster ({starters.length})</h4>
                  <table class="data" style="font-size:13px">
                    <thead><tr><th>Rider</th><th style="text-align:center">OVR</th><th style="text-align:center">Age</th><th style="text-align:center">Class</th><th>Status</th></tr></thead>
                    <tbody>
                      {starters.map(r => (
                        <tr key={r.id}>
                          <td>#{r.number} {r.name}</td>
                          <td style="text-align:center">{r.overall}</td>
                          <td style="text-align:center">{r.age}</td>
                          <td style="text-align:center">{classById(r.classId as any)?.shortName ?? '?'}</td>
                          <td>
                            {r.injuredForRounds > 0 ? (
                              <span style="color:#e74c3c">🏥 {r.injuredForRounds} round{r.injuredForRounds !== 1 ? 's' : ''}</span>
                            ) : r.suspendedForRounds && r.suspendedForRounds > 0 ? (
                              <span style="color:#e74c3c">🚫 Suspended</span>
                            ) : (
                              <span style="color:#2ecc71">✓ Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {bench.length > 0 && (
                  <div class="section">
                    <h4>Bench ({bench.length})</h4>
                    <table class="data" style="font-size:13px">
                      <thead><tr><th>Rider</th><th style="text-align:center">OVR</th><th style="text-align:center">Age</th><th style="text-align:center">Class</th></tr></thead>
                      <tbody>
                        {bench.map(r => (
                          <tr key={r.id} style="opacity:0.7">
                            <td>#{r.number} {r.name}</td>
                            <td style="text-align:center">{r.overall}</td>
                            <td style="text-align:center">{r.age}</td>
                            <td style="text-align:center">{classById(r.classId as any)?.shortName ?? '?'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p class="muted" style="margin-top:8px;font-size:11px">Bench riders fill in for injured or suspended starters (rulebook §4.8.1).</p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Finances */}
          {panel === 'money' && (() => {
            const cal = u.calendars[state.discipline];
            const roundsRun = Math.min(state.round, state.history.length);
            const totalPurse = state.leagueHealth.reduce((sum, lh) => {
              const entry = lh.ledger.find(e => e.teamId === team.id);
              return sum + (entry?.purse ?? 0);
            }, 0);
            const totalAppearance = state.leagueHealth.reduce((sum, lh) => {
              const entry = lh.ledger.find(e => e.teamId === team.id);
              return sum + (entry?.appearance ?? 0);
            }, 0);
            const totalRevenue = state.leagueHealth.reduce((sum, lh) => {
              const entry = lh.ledger.find(e => e.teamId === team.id);
              return sum + (entry?.revenuePool ?? 0);
            }, 0);
            const totalSalaries = state.leagueHealth.reduce((sum, lh) => {
              const entry = lh.ledger.find(e => e.teamId === team.id);
              return sum + (entry?.salaries ?? 0);
            }, 0);
            const netEarnings = totalPurse + totalAppearance + totalRevenue - totalSalaries;
            const avgRoundFlow = roundsRun > 0 ? Math.round(netEarnings / roundsRun) : 0;
            const projectedEndOfSeason = Math.round(team.budget + (avgRoundFlow * (cal.length - state.round)));

            return (
              <div class="section">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
                  <div class="panel" style="padding:12px">
                    <div class="muted" style="font-size:12px">Cash on Hand</div>
                    <div style="font-size:24px;font-weight:bold;color:#2ecc71">${Math.round(team.budget).toLocaleString()}</div>
                  </div>
                  <div class="panel" style="padding:12px">
                    <div class="muted" style="font-size:12px">Season Projection</div>
                    <div style={`font-size:24px;font-weight:bold;color:${projectedEndOfSeason < 0 ? '#e74c3c' : '#2ecc71'}`}>
                      ${Math.round(projectedEndOfSeason).toLocaleString()}
                    </div>
                  </div>
                </div>

                <h4 style="margin-bottom:8px">Season Totals (R1–R{state.round})</h4>
                <table class="data" style="margin-bottom:16px;font-size:13px">
                  <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
                  <tbody>
                    <tr><td>Prize Money</td><td style="text-align:right;color:#2ecc71">+${Math.round(totalPurse).toLocaleString()}</td></tr>
                    <tr><td>Appearance Fees</td><td style="text-align:right;color:#2ecc71">+${Math.round(totalAppearance).toLocaleString()}</td></tr>
                    <tr><td>League Revenue Share</td><td style="text-align:right;color:#2ecc71">+${Math.round(totalRevenue).toLocaleString()}</td></tr>
                    <tr><td style="border-bottom:1px solid #1a1f3a">Salary Payroll</td><td style="text-align:right;color:#e74c3c;border-bottom:1px solid #1a1f3a">−${Math.round(totalSalaries).toLocaleString()}</td></tr>
                    <tr><td style="font-weight:bold">Net Cash Flow</td><td style={`text-align:right;font-weight:bold;color:${netEarnings >= 0 ? '#2ecc71' : '#e74c3c'}`}>{netEarnings >= 0 ? '+' : '−'}${Math.round(Math.abs(netEarnings)).toLocaleString()}</td></tr>
                  </tbody>
                </table>

                <h4 style="margin-bottom:8px">Recent Races</h4>
                <table class="data" style="font-size:13px">
                  <thead><tr><th>Round</th><th>Track</th><th>Class Winner</th><th>Your Best</th></tr></thead>
                  <tbody>
                    {state.history.slice(0, 8).map((h, i) => {
                      const track = u.tracks[cal[h.round - 1]?.trackId];
                      return (
                        <tr key={i}>
                          <td>R{h.round}</td>
                          <td class="muted" style="font-size:11px">{track?.name ?? '?'}</td>
                          <td>{h.winnerName.split(' ')[0]}</td>
                          <td><strong>{h.playerBest}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* League Health */}
          {panel === 'league' && state.discipline === 'namc' && (
            <div class="section">
              <h3>⚖️ League Health & Compliance</h3>
              {state.welfareFund.totalAccumulated > 0 && (
                <div class="panel" style="padding:12px;margin-bottom:12px;background:#1a1f3a">
                  <div class="muted" style="font-size:12px">Rider Welfare Fund (§13.5)</div>
                  <div style="font-size:20px;font-weight:bold;color:#2ecc71">${Math.round(state.welfareFund.totalAccumulated).toLocaleString()}</div>
                  <div class="muted" style="font-size:11px">{state.welfareFund.fineHistory.length} fines collected</div>
                </div>
              )}

              <h4>Penalty & Strike Summary</h4>
              {Object.values(u.teams).filter(t => t.discipline === 'namc' && (t.strikes > 0 || t.charterRevoked)).length === 0 ? (
                <p class="muted">All teams in good standing.</p>
              ) : (
                <table class="data" style="font-size:13px">
                  <thead><tr><th>Team</th><th style="text-align:center">Strikes</th><th>Status</th></tr></thead>
                  <tbody>
                    {Object.values(u.teams)
                      .filter(t => t.discipline === 'namc' && (t.strikes > 0 || t.charterRevoked))
                      .map((t, i) => (
                        <tr key={i}>
                          <td>{t.name}</td>
                          <td style="text-align:center"><strong>{t.strikes}/3</strong></td>
                          <td>
                            {t.charterRevoked ? (
                              <span style="color:#c0392b">❌ Charter Revoked</span>
                            ) : t.strikes >= 2 ? (
                              <span style="color:#e74c3c">⚠️ {3 - t.strikes} strike remaining</span>
                            ) : (
                              <span style="color:#f39c12">{3 - t.strikes} strikes remaining</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {state.leagueHealth.length > 0 && (
                <>
                  <h4 style="margin-top:16px">Round {state.leagueHealth[state.leagueHealth.length - 1].round} Financial Status</h4>
                  {(() => {
                    const lh = state.leagueHealth[state.leagueHealth.length - 1];
                    const insolvent = lh.ledger.filter(l => (u.teams[l.teamId]?.budget ?? 0) < 0).length;
                    const totalLeaguePurse = lh.ledger.reduce((s, l) => s + l.purse, 0);
                    return (
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <div class="panel" style="padding:12px">
                          <div class="muted" style="font-size:12px">Purse Distributed</div>
                          <div style="font-size:18px;font-weight:bold">${Math.round(totalLeaguePurse).toLocaleString()}</div>
                        </div>
                        <div class="panel" style="padding:12px">
                          <div class="muted" style="font-size:12px">Teams in Budget</div>
                          <div style={`font-size:18px;font-weight:bold;color:${insolvent > 0 ? '#e74c3c' : '#2ecc71'}`}>{20 - insolvent}/20</div>
                          {insolvent > 0 && <div class="muted" style="font-size:11px">{insolvent} teams insolvent</div>}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay modal layer for full-screen panels */}
      {overlay && (
        <div class="hub-overlay">
          <div class="overlay-backdrop" onClick={() => setOverlay(null)} />
          <div class="overlay-panel">
            <button class="overlay-close" onClick={() => setOverlay(null)}>✕</button>
            {overlay === 'showroom' && (
              <div class="overlay-content">
                <h2>Showroom</h2>
                <p class="muted">Shop for engines, chassis, and tires.</p>
                <button class="btn-primary" onClick={() => { onOpenShowroom(); setOverlay(null); }}>Open in Detail</button>
              </div>
            )}
            {overlay === 'garage' && (
              <div class="overlay-content">
                <h2>Garage</h2>
                <p class="muted">Manage bike setup, components, and engine mode.</p>
                <button class="btn-primary" onClick={() => { onOpenGarage(); setOverlay(null); }}>Open in Detail</button>
              </div>
            )}
            {overlay === 'training' && (
              <div class="overlay-content">
                <h2>Training Center</h2>
                <p class="muted">Develop rider skills and manage stamina.</p>
                <button class="btn-primary" onClick={() => { onOpenTraining(); setOverlay(null); }}>Open in Detail</button>
              </div>
            )}
            {overlay === 'dashboard' && (
              <div class="overlay-content">
                <h2>Team Dashboard</h2>
                <p class="muted">Team management for NAMC multi-class operations.</p>
                <button class="btn-primary" onClick={() => { onViewDashboard?.(); setOverlay(null); }}>Open in Detail</button>
              </div>
            )}
            {overlay === 'placeholder' && (
              <div class="overlay-content">
                <h2>{placeholderTitle}</h2>
                {placeholderNote && <p class="muted">{placeholderNote}</p>}
                <button class="btn-primary" onClick={() => { onOpenPlaceholder(placeholderTitle, placeholderNote); setOverlay(null); }}>Full View</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
