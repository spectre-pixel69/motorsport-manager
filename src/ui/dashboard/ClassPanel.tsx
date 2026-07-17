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
import { getChampionshipForClass, getClassColor } from './helpers';

type ModalType = 'draft' | 'freeagents' | 'calendar';

interface Props {
  state: CareerState;
  classId: ClassId;
  isSelected: boolean;
  onSelectRider: (riderId: string) => void;
  expandedRiderId: string | null;
  onOpenModal?: (modalType: ModalType) => void;
}

export function ClassPanel({
  state,
  classId,
  isSelected,
  onSelectRider,
  expandedRiderId,
  onOpenModal,
}: Props) {
  const u = state.universe;
  const team = u.teams[state.playerTeamId];
  const classInfo = classById(classId);
  const champ = getChampionshipForClass(classId);
  const standings = riderStandingsFor(state, classId, champ);
  const allRiders = ridersOfTeam(u, team.id).filter(r => r.classId === classId);
  const myRiders = allRiders.filter(r => !r.bench);
  const benchRiders = allRiders.filter(r => r.bench);

  const classColor = getClassColor(classId);
  const panelStyle = {
    borderTop: `3px solid ${classColor}`,
  };

  return (
    <div class="class-panel" style={panelStyle}>
      <div class="panel-header" style={{ backgroundColor: classColor }}>
        <h2>{classInfo.name}</h2>
      </div>

      <div class="panel-content">
        {/* Left: Rider Roster */}
        <div class="panel-section roster-section">
          <RiderRoster
            riders={myRiders}
            benchRiders={benchRiders}
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
            state={state}
            onOpenModal={onOpenModal}
          />
        </div>
      </div>
    </div>
  );
}
