// Team Management Dashboard - NAMC v15.1
// Gemini-designed layout: 4 class panels, financial tracking, championship standings

import { useState, useEffect } from 'preact/hooks';
import type { CareerState } from '../game/state';
import { NAMC_CLASS_IDS } from '../data/namc';
import type { ClassId } from '../data/types';
import { Logo } from './Logo';
import { ClassPanel } from './dashboard/ClassPanel';
import { OverallChampionship } from './dashboard/OverallChampionship';
import { SeasonProgress } from './dashboard/SeasonProgress';
import './dashboard.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

export function TeamDashboard({ state, onExit }: Props) {
  const [selectedClass, setSelectedClass] = useState<ClassId | null>(null);
  const [expandedRider, setExpandedRider] = useState<string | null>(null);
  const u = state.universe;
  const team = u.teams[state.playerTeamId];
  const cal = u.calendars[state.discipline];

  return (
    <div class="team-dashboard">
      {/* Header */}
      <div class="dashboard-header">
        <div class="header-left">
          <Logo spec={team.logo} size={40} />
          <div>
            <h1>{team.name}</h1>
            <span class="season-label">Season {state.season} • NAMC</span>
          </div>
        </div>
        <div class="header-right">
          <span class="budget">Budget: ${Math.round(team.budget).toLocaleString()}</span>
          <button class="btn-secondary" onClick={onExit}>← Back</button>
        </div>
      </div>

      {/* Overall Championship & Season Progress */}
      <OverallChampionship state={state} />
      <SeasonProgress state={state} currentRound={state.round} totalRounds={cal.length} />

      {/* Four Class Panels */}
      <div class="class-panels-grid">
        {NAMC_CLASS_IDS.map(classId => (
          <ClassPanel
            key={classId}
            state={state}
            classId={classId}
            isSelected={selectedClass === classId}
            onSelectRider={(riderId) => setExpandedRider(riderId)}
            expandedRiderId={expandedRider}
          />
        ))}
      </div>

      {/* Rider Detail Modal - will implement when rider is clicked */}
      {expandedRider && (
        <div class="modal-backdrop" onClick={() => setExpandedRider(null)}>
          <div class="modal" onClick={e => e.stopPropagation()}>
            <button class="modal-close" onClick={() => setExpandedRider(null)}>✕</button>
            {/* Rider detail content goes here */}
          </div>
        </div>
      )}
    </div>
  );
}
