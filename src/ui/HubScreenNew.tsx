// PADDOCK BOSS — Command Center HubScreen
// The canonical main page: your digital pit wall and team headquarters
// Design: sleek command center aesthetic with real-time team vitals, media feeds, and race readiness

import { useState, useEffect } from 'preact/hooks';
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
import { RyansBriefing } from './RyansBriefing';
import { TrackDays } from './TrackDays';
import type { WeekendResult } from '../sim/weekend';

interface Props {
  state: CareerState;
  onRaceReady: (weekends: WeekendResult[], playerWeekend: WeekendResult | null) => void;
  onExit: () => void;
  onOpenShowroom: () => void;
  onOpenGarage: () => void;
  onOpenTraining: () => void;
  onOpenRDCenter: () => void;
  onOpenPlaceholder: (title: string, note?: string) => void;
  onRunOffSeason: () => void;
  onViewDashboard?: () => void;
}

export function HubScreenNew({
  state,
  onRaceReady,
  onExit,
  onOpenShowroom,
  onOpenGarage,
  onOpenTraining,
  onOpenRDCenter,
  onOpenPlaceholder,
  onRunOffSeason,
  onViewDashboard,
}: Props) {
  const [stClass, setStClass] = useState<ClassId>(state.focusClass);
  const [stChamp, setStChamp] = useState<ChampionshipId>(state.championship);
  const [approaches, setApproaches] = useState<ApproachMap>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'standings' | 'team' | 'media'>('overview');
  const [animatedMetrics, setAnimatedMetrics] = useState(0);

  const u = state.universe;
  const team = u.teams[state.playerTeamId];
  const cal = u.calendars[state.discipline];
  const nextRound = state.round < cal.length ? cal[state.round] : null;
  const nextTrack = nextRound ? u.tracks[nextRound.trackId] : null;
  const myRiders = ridersOfTeam(u, team.id).filter(r => !r.bench);
  const standings = riderStandingsFor(state, stClass, stChamp);
  const teamStanding = teamStandingsFor(state, stClass);
  const playerTeamRank = teamStanding.findIndex(t => t.team.id === team.id) + 1;
  const meta = DISCIPLINE_META[state.discipline];

  useEffect(() => {
    setAnimatedMetrics(1);
  }, []);

  const goRacing = () => {
    logRaceStart(state, state.round + 1, nextRound!.trackId);
    const { weekends, playerWeekend } = runRound(state, approaches);
    logRaceEnd(state, weekends, playerWeekend);
    saveCareer(state);
    onRaceReady(weekends, playerWeekend);
  };

  const progressPercent = (state.round / cal.length) * 100;
  const budgetPercent = (team.budget / 2_500_000) * 100;

  return (
    <div class="screen" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem' }}>
      {/* HEADER: Command Center Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '0.8rem',
          borderBottom: '1px solid rgba(52, 152, 219, 0.2)',
          animation: 'slideInUp 0.5s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>🏭</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#e8e8e8', animation: 'glowBlue 2.5s ease-in-out infinite' }}>{team.name}</h1>
            <div style={{ fontSize: '0.85rem', color: '#8892a0' }}>
              Season {state.season} • Round {state.round + 1}/{cal.length} • {meta.name}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button class="ghost" onClick={onViewDashboard} style={{ transition: 'all 0.3s ease' }}>📊 Dashboard</button>
          <button class="ghost" onClick={onExit} style={{ transition: 'all 0.3s ease' }}>← Exit</button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem', flex: 1, minHeight: 0 }}>
        {/* LEFT: Core Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflow: 'auto' }}>
          {/* TEAM VITALS — 4-column metric grid */}
          <div class="panel animate-fade-in" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#3498db', marginBottom: '0.8rem' }}>
              ⚡ TEAM VITALS
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.8rem',
              }}
            >
              <div style={{ textAlign: 'center', animation: 'slideInUp 0.5s ease-out' }}>
                <div style={{ fontSize: '0.75rem', color: '#8892a0', marginBottom: '0.3rem' }}>Balance</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#2ecc71', animation: 'glowGreen 2.5s ease-in-out infinite' }}>
                  ${Math.round(team.budget / 1000)}k
                </div>
                <div style={{ fontSize: '0.65rem', color: '#8892a0', marginTop: '0.2rem' }}>
                  {budgetPercent.toFixed(0)}% of budget
                </div>
              </div>

              <div style={{ textAlign: 'center', animation: 'slideInUp 0.6s ease-out' }}>
                <div style={{ fontSize: '0.75rem', color: '#8892a0', marginBottom: '0.3rem' }}>Prestige</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f39c12', animation: 'glow 2.5s ease-in-out infinite' }}>
                  {Math.round(team.prestige)}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#8892a0', marginTop: '0.2rem' }}>
                  {team.prestige > 70 ? 'Elite' : team.prestige > 50 ? 'Strong' : 'Rising'}
                </div>
              </div>

              <div style={{ textAlign: 'center', animation: 'slideInUp 0.7s ease-out' }}>
                <div style={{ fontSize: '0.75rem', color: '#8892a0', marginBottom: '0.3rem' }}>Reliability</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#3498db', animation: 'glowBlue 2.5s ease-in-out infinite' }}>
                  {Math.round(team.bike.reliability)}%
                </div>
                <div style={{ fontSize: '0.65rem', color: '#8892a0', marginTop: '0.2rem' }}>
                  {team.bike.reliability > 75 ? 'Solid' : team.bike.reliability > 60 ? 'Fair' : 'At Risk'}
                </div>
              </div>

              <div style={{ textAlign: 'center', animation: 'slideInUp 0.8s ease-out' }}>
                <div style={{ fontSize: '0.75rem', color: '#8892a0', marginBottom: '0.3rem' }}>R&D Level</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#e74c3c', animation: 'glow 2.5s ease-in-out infinite' }}>
                  Lv.{Math.round((team.bike.engine + team.bike.handling + team.bike.reliability) / 75)}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#8892a0', marginTop: '0.2rem' }}>
                  Performance edge
                </div>
              </div>
            </div>
          </div>

          {/* SEASON PROGRESS BAR */}
          <div class="panel" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#3498db' }}>📅 Season Progress</span>
              <span style={{ fontSize: '0.75rem', color: '#8892a0' }}>
                {state.round}/{cal.length} rounds
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: '#3498db',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* NEXT RACE */}
          {nextTrack && !seasonOver(state) && (
            <div class="panel animate-fade-in" style={{ padding: '1rem', backgroundColor: 'rgba(46, 204, 113, 0.05)', borderLeft: '3px solid #2ecc71', animation: 'slideInUp 0.6s ease-out' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2ecc71', marginBottom: '0.6rem', animation: 'glowGreen 2s ease-in-out infinite' }}>
                🏁 Next Race
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#e8e8e8', marginBottom: '0.3rem' }}>
                {nextTrack.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#b0b8c0', marginBottom: '0.8rem' }}>
                {nextTrack.kind} • {nextTrack.terrain}
              </div>
              <button class="primary" onClick={goRacing} style={{ width: '100%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                🚀 Go Racing
              </button>
            </div>
          )}

          {seasonOver(state) && (
            <div class="panel animate-fade-in" style={{ padding: '1rem', backgroundColor: 'rgba(243, 156, 18, 0.05)', borderLeft: '3px solid #f39c12', animation: 'slideInUp 0.6s ease-out' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f39c12', marginBottom: '0.6rem', animation: 'glow 2.5s ease-in-out infinite' }}>
                🗓️ Off-Season
              </div>
              <div style={{ fontSize: '0.9rem', color: '#b0b8c0', marginBottom: '0.8rem' }}>
                Season {state.season} complete. Time to settle up and prepare for next year.
              </div>
              <button class="primary" onClick={onRunOffSeason} style={{ width: '100%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                📋 Review & Draft
              </button>
            </div>
          )}

          {/* MEDIA FEEDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div style={{ minHeight: 0, overflow: 'auto' }}>
              <RyansBriefing newsArchive={u.newsArchive} currentDiscipline={state.discipline} maxItems={2} />
            </div>
            <div style={{ minHeight: 0, overflow: 'auto' }}>
              <TrackDays trackDaysArchive={u.trackDaysArchive} maxItems={2} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Quick Access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflow: 'auto' }}>
          {/* TEAM RANK */}
          <div class="panel animate-fade-in" style={{ padding: '1rem', textAlign: 'center', animation: 'slideInLeft 0.5s ease-out' }}>
            <div style={{ fontSize: '0.75rem', color: '#8892a0', marginBottom: '0.4rem', animation: 'glow 2.5s ease-in-out infinite' }}>YOUR RANK</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#f39c12', animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite', display: 'inline-block', borderRadius: '8px', padding: '0.3rem 0.6rem' }}>{playerTeamRank}</div>
            <div style={{ fontSize: '0.8rem', color: '#8892a0', marginTop: '0.4rem' }}>of {teamStanding.length} teams</div>
          </div>

          {/* CLASS SELECTOR */}
          <div class="panel animate-fade-in" style={{ padding: '1rem', animation: 'slideInLeft 0.6s ease-out' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3498db', marginBottom: '0.6rem', animation: 'glowBlue 2.5s ease-in-out infinite' }}>
              Classes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {NAMC_CLASS_IDS.slice(0, 2).map(cls => (
                <button
                  key={cls}
                  class={stClass === cls ? 'primary' : 'ghost'}
                  onClick={() => setStClass(cls)}
                  style={{ fontSize: '0.85rem', padding: '0.5rem', transition: 'all 0.3s ease' }}
                >
                  {classById(cls).shortName}
                </button>
              ))}
            </div>
          </div>

          {/* TOP 5 CHAMPIONSHIP */}
          <div class="panel animate-fade-in" style={{ padding: '1rem', flex: 1, minHeight: 0, overflow: 'auto', animation: 'slideInLeft 0.7s ease-out' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3498db', marginBottom: '0.6rem', animation: 'glowBlue 2.5s ease-in-out infinite' }}>
              🏆 Top Riders
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {standings.slice(0, 5).map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: row.rider.teamId === team.id ? 'rgba(46, 204, 113, 0.1)' : 'transparent',
                    borderRadius: '3px',
                    fontSize: '0.8rem',
                    animation: `slideInUp ${0.3 + i * 0.1}s ease-out`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ color: '#8892a0', fontWeight: 500 }}>#{i + 1}</span>
                  <span style={{ color: row.rider.teamId === team.id ? '#2ecc71' : '#b0b8c0', flex: 1 }}>
                    {row.rider.name.split(' ')[0]}
                  </span>
                  <span style={{ color: '#3498db', fontWeight: 600 }}>{row.pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MANAGEMENT QUICK ACCESS */}
          <div class="panel animate-fade-in" style={{ padding: '1rem', animation: 'slideInLeft 0.8s ease-out' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3498db', marginBottom: '0.6rem', animation: 'glowBlue 2.5s ease-in-out infinite' }}>
              ⚙️ Manage
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button class="ghost" onClick={onOpenShowroom} style={{ fontSize: '0.8rem', padding: '0.5rem', transition: 'all 0.3s ease' }}>
                🛒 Showroom
              </button>
              <button class="ghost" onClick={onOpenGarage} style={{ fontSize: '0.8rem', padding: '0.5rem', transition: 'all 0.3s ease' }}>
                🔧 Garage
              </button>
              <button class="ghost" onClick={onOpenTraining} style={{ fontSize: '0.8rem', padding: '0.5rem', transition: 'all 0.3s ease' }}>
                💪 Training
              </button>
              <button class="ghost" onClick={onOpenRDCenter} style={{ fontSize: '0.8rem', padding: '0.5rem', transition: 'all 0.3s ease' }}>
                🔬 R&D Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function seasonOver(state: CareerState): boolean {
  return state.round >= state.universe.calendars[state.discipline].length;
}
