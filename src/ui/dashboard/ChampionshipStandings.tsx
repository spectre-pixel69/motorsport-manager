// Championship Standings - Class-specific points standings table

import type { RiderStanding } from '../../game/state';

interface Props {
  standings: RiderStanding[];
}

export function ChampionshipStandings({ standings }: Props) {
  return (
    <div class="championship-standings">
      <h3>Class Championship Standings</h3>

      {standings.length === 0 ? (
        <p class="empty">No races yet</p>
      ) : (
        <div class="standings-table compact">
          <div class="table-header">
            <div class="col-pos">Pos</div>
            <div class="col-rider">Rider Name</div>
            <div class="col-team">Team</div>
            <div class="col-points">Points</div>
            <div class="col-wins">Wins</div>
            <div class="col-podiums">Podiums</div>
          </div>
          {standings.slice(0, 16).map((entry, idx) => (
            <div class="table-row" key={entry.rider.id}>
              <div class="col-pos">{idx + 1}</div>
              <div class="col-rider">
                <span class="rider-number">#{entry.rider.number}</span>
                {entry.rider.name}
              </div>
              <div class="col-team">{entry.team?.name || '—'}</div>
              <div class="col-points"><strong>{entry.points}</strong></div>
              <div class="col-wins">{entry.wins}</div>
              <div class="col-podiums">{entry.podiums}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
