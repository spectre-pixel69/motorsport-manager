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
import { DraftPool } from './dashboard/DraftPool';
import { FreeAgents } from './dashboard/FreeAgents';
import { SeasonCalendar } from './dashboard/SeasonCalendar';
import { RiderDetailModal } from './dashboard/RiderDetailModal';
import { LeagueHealth } from './dashboard/LeagueHealth';
import './dashboard.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

type ModalType = null | 'draft' | 'freeagents' | 'calendar' | 'rider';
type TabType = 'overview' | 'league-health';

export function TeamDashboard({ state, onExit }: Props) {
  const [selectedClass, setSelectedClass] = useState<ClassId>(state.focusClass);
  const [expandedRider, setExpandedRider] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [tab, setTab] = useState<TabType>('overview');
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

      {/* Tab Navigation */}
      <div class="dashboard-tabs">
        <button
          class={`tab ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          📊 Team Overview
        </button>
        <button
          class={`tab ${tab === 'league-health' ? 'active' : ''}`}
          onClick={() => setTab('league-health')}
        >
          ⚖️ League Health
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <>
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
                onOpenModal={(modalType) => setOpenModal(modalType)}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'league-health' && (
        <LeagueHealth state={state} />
      )}

      {/* Modal Backdrop & Content */}
      {openModal && (
        <div class="modal-backdrop" onClick={() => setOpenModal(null)}>
          <div class="modal" onClick={e => e.stopPropagation()}>
            {openModal === 'draft' && (
              <DraftPool
                universe={u}
                teamId={team.id}
                classId={selectedClass}
                onClose={() => setOpenModal(null)}
              />
            )}
            {openModal === 'freeagents' && (
              <FreeAgents
                universe={u}
                teamId={team.id}
                classId={selectedClass}
                onClose={() => setOpenModal(null)}
              />
            )}
            {openModal === 'calendar' && (
              <SeasonCalendar
                state={state}
                onClose={() => setOpenModal(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* Rider Detail Modal */}
      {expandedRider && u.riders[expandedRider] && (
        <div class="modal-backdrop" onClick={() => setExpandedRider(null)}>
          <div class="modal rider-detail" onClick={e => e.stopPropagation()}>
            <button class="modal-close" onClick={() => setExpandedRider(null)}>✕</button>
            <RiderDetailModal
              rider={u.riders[expandedRider]}
              universe={u}
              onClose={() => setExpandedRider(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
