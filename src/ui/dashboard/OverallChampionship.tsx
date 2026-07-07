// Overall Championship - Top riders across all 4 NAMC classes combined

import type { CareerState } from '../../game/state';
import { riderStandingsFor } from '../../game/state';
import { NAMC_CLASS_IDS } from '../../data/namc';
import { getChampionshipForClass } from './helpers';

interface Props {
  state: CareerState;
}

export function OverallChampionship({ state }: Props) {
  const u = state.universe;

  // Aggregate standings across all NAMC classes
  const allStandings = NAMC_CLASS_IDS.flatMap(classId => {
    const champ = getChampionshipForClass(classId);
    return riderStandingsFor(state, classId, champ).map(entry => ({
      ...entry,
      classId,
    }));
  });

  // Group by rider and sum points
  const riderTotals = new Map<string, {
    riderId: string;
    rider: any;
    points: number;
  }>();

  allStandings.forEach(entry => {
    const key = entry.rider.id;
    const existing = riderTotals.get(key);
    if (existing) {
      existing.points += entry.pts;
    } else {
      riderTotals.set(key, {
        riderId: entry.rider.id,
        rider: entry.rider,
        points: entry.pts,
      });
    }
  });

  const sorted = Array.from(riderTotals.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 12);

  return (
    <div class="overall-championship">
      <h3>Overall Championship - Top Riders Across All Series</h3>
      <div class="standings-table">
        <div class="table-header">
          <div class="col-pos">Pos</div>
          <div class="col-rider">Rider Name</div>
          <div class="col-team">Team</div>
          <div class="col-points">Total Points</div>
          <div class="col-wins">Wins</div>
          <div class="col-podiums">Podiums</div>
        </div>
        {sorted.map((entry, idx) => (
          <div class="table-row" key={entry.riderId}>
            <div class="col-pos">{idx + 1}</div>
            <div class="col-rider">
              <span class="rider-number">#{entry.rider.number}</span>
              {entry.rider.name}
            </div>
            <div class="col-team">{u.teams[entry.rider.teamId]?.name || '—'}</div>
            <div class="col-points"><strong>{entry.points}</strong></div>
            <div class="col-wins">—</div>
            <div class="col-podiums">—</div>
          </div>
        ))}
      </div>
    </div>
  );
}
