// Championship Standings - Class-specific points standings table with gap analysis

import type { Rider, Team } from '../../data/types';

interface StandingEntry {
  rider: Rider;
  pts: number;
  team?: Team;
}

interface Props {
  standings: StandingEntry[];
}

export function ChampionshipStandings({ standings }: Props) {
  const hasRaces = standings.length > 0 && standings[0]?.pts > 0;

  return (
    <div class="championship-standings">
      <h3>Class Championship</h3>

      {!hasRaces ? (
        <p class="empty">No races completed yet</p>
      ) : (
        <div class="standings-table compact">
          <div class="table-header">
            <div class="col-pos">Pos</div>
            <div class="col-rider">Rider</div>
            <div class="col-team">Team</div>
            <div class="col-points">Pts</div>
            <div class="col-gap">Gap</div>
            <div class="col-wins">W</div>
            <div class="col-pods">P</div>
          </div>
          {standings.slice(0, 12).map((entry, idx) => {
            const leader = standings[0];
            const gap = idx === 0 ? 0 : leader.pts - entry.pts;
            const riderTeam = entry.rider.teamId ? { name: entry.team?.name } : null;

            return (
              <div
                class={`table-row ${idx === 0 ? 'leader' : ''}`}
                key={entry.rider.id}
                title={`${entry.rider.name} • ${entry.pts} pts`}
              >
                <div class="col-pos">{idx + 1}</div>
                <div class="col-rider">
                  <span class="rider-number">#{entry.rider.number}</span>
                  <span class="rider-name">{entry.rider.name.split(' ')[0]}</span>
                </div>
                <div class="col-team muted">{riderTeam?.name?.split(' ')[0] || '—'}</div>
                <div class="col-points">
                  <strong>{entry.pts}</strong>
                </div>
                <div class="col-gap muted">
                  {gap === 0 ? '—' : `+${gap}`}
                </div>
                <div class="col-wins">{entry.rider.careerWins}</div>
                <div class="col-pods">{entry.rider.careerPodiums}</div>
              </div>
            );
          })}
        </div>
      )}

      {standings.length > 12 && (
        <p class="muted" style="margin-top:8px;font-size:11px">
          + {standings.length - 12} more riders
        </p>
      )}
    </div>
  );
}
