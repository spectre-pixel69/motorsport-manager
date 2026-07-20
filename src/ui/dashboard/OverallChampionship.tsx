// Overall Championship - Top riders across all 4 NAMC classes combined

import type { CareerState } from '../../game/state';
import { riderStandingsFor } from '../../game/state';
import { classById } from '../../data/classes';
import { getChampionshipForClass, classLadderFor } from './helpers';

interface Props {
  state: CareerState;
}

export function OverallChampionship({ state }: Props) {
  const u = state.universe;
  const ladder = classLadderFor(state.discipline);
  const title = state.discipline === 'namc'
    ? '🏆 Multi-Class Overall Championship'
    : `🏆 ${state.discipline === 'gp' ? 'GP' : 'SBK'} Overall Standings (all classes)`;

  // Aggregate standings across all of this discipline's classes
  const allStandings = ladder.flatMap(classId => {
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
    classId: string;
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
        classId: entry.classId,
      });
    }
  });

  const sorted = Array.from(riderTotals.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 12);

  const hasRaces = sorted.length > 0 && sorted[0]?.points > 0;

  return (
    <div class="overall-championship">
      <h3>{title}</h3>
      {!hasRaces ? (
        <p class="empty">Complete races in any class to see standings</p>
      ) : (
        <div class="standings-table">
          <div class="table-header">
            <div class="col-pos">Pos</div>
            <div class="col-rider">Rider</div>
            <div class="col-team">Team</div>
            <div class="col-points">Pts</div>
            <div class="col-wins" title="Career wins">W</div>
            <div class="col-podiums" title="Career podiums">P</div>
          </div>
          {sorted.map((entry, idx) => {
            const team = u.teams[entry.rider.teamId];
            const leader = sorted[0];
            const gap = idx === 0 ? 0 : leader.points - entry.points;

            return (
              <div
                class={`table-row ${idx === 0 ? 'leader' : ''}`}
                key={entry.riderId}
              >
                <div class="col-pos">{idx + 1}</div>
                <div class="col-rider">
                  <span class="rider-number">#{entry.rider.number}</span>
                  <span>{entry.rider.name.split(' ')[0]}</span>
                  <span class="class-chip" title={classById(entry.classId as any)?.name}>
                    {classById(entry.classId as any)?.shortName ?? entry.classId}
                  </span>
                </div>
                <div class="col-team muted">{team?.name?.split(' ')[0] || '—'}</div>
                <div class="col-points">
                  <strong>{entry.points}</strong>
                  {gap > 0 && <span class="gap"> +{gap}</span>}
                </div>
                <div class="col-wins">{entry.rider.careerWins}</div>
                <div class="col-podiums">{entry.rider.careerPodiums}</div>
              </div>
            );
          })}
        </div>
      )}
      {sorted.length > 12 && (
        <p class="muted" style="margin-top:8px;font-size:11px">
          + {sorted.length - 12} more riders
        </p>
      )}
      {hasRaces && (
        <p class="muted" style="margin-top:4px;font-size:10px">
          W/P = career totals · chip = rider's class
        </p>
      )}
    </div>
  );
}
