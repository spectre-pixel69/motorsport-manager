// Class Panel - One of 4 vertical panels (350 Pro, 250, 250P, Women's 250)
// Shows: Rider Roster | Championship Standings | Tire Champ | Financial Tracker

import type { ClassId } from '../../data/types';
import type { CareerState } from '../../game/state';
import { riderStandingsFor } from '../../game/state';
import { ridersOfTeam } from '../../data/universe';
import { classById } from '../../data/classes';
import { RiderRoster } from './RiderRoster';
import { ChampionshipStandings } from './ChampionshipStandings';
import { FinancialTracker } from './FinancialTracker';
import { TireChampionship } from './TireChampionship';

interface Props {
  state: CareerState;
  classId: ClassId;
  isSelected: boolean;
  onSelectRider: (riderId: string) => void;
  expandedRiderId: string | null;
}

export function ClassPanel({
  state,
  classId,
  isSelected,
  onSelectRider,
  expandedRiderId,
}: Props) {
  const u = state.universe;
  const team = u.teams[state.playerTeamId];
  const classInfo = classById(classId);
  const standings = riderStandingsFor(state, classId);
  const myRiders = ridersOfTeam(u, team.id).filter(r => r.classId === classId && !r.bench);

  // Get class-specific color scheme
  const classColors: Record<ClassId, string> = {
    fourStroke: '#FF9800', // Orange for 350 Pro
    twoStroke: '#2196F3', // Blue for 250
    twoStroke250p: '#E91E63', // Pink/Red for 250P
    twoStroke250w: '#9C27B0', // Purple for Women's
  };

  const panelStyle = {
    borderTop: `3px solid ${classColors[classId]}`,
  };

  return (
    <div class="class-panel" style={panelStyle}>
      <div class="panel-header" style={{ backgroundColor: classColors[classId] }}>
        <h2>{classInfo.name}</h2>
      </div>

      <div class="panel-content">
        {/* Left: Rider Roster */}
        <div class="panel-section roster-section">
          <RiderRoster
            riders={myRiders}
            team={team}
            onSelectRider={onSelectRider}
            isExpanded={expandedRiderId !== null}
          />
        </div>

        {/* Center: Standings + Tire Championship */}
        <div class="panel-section standings-section">
          <ChampionshipStandings standings={standings} />
          <TireChampionship standings={standings} />
        </div>

        {/* Right: Financial Tracker */}
        <div class="panel-section financial-section">
          <FinancialTracker
            team={team}
            myRiders={myRiders}
            classId={classId}
            standings={standings}
          />
        </div>
      </div>
    </div>
  );
}
