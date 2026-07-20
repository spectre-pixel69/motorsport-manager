// Constructor/Manufacturer Championship - GP constructor / WorldSBK manufacturer
// standings for one class. NAMC has no equivalent (tire championship instead —
// see TireChampionship.tsx).

import type { Team } from '../../data/types';

interface StandingEntry {
  team: Team;
  pts: number;
}

interface Props {
  standings: StandingEntry[];
  label: string; // "Constructor Championship" (gp) | "Manufacturer Championship" (sbk)
}

export function ConstructorStandings({ standings, label }: Props) {
  const hasRaces = standings.length > 0 && standings[0]?.pts > 0;

  return (
    <div class="tire-championship">
      <h3>{label}</h3>

      {!hasRaces ? (
        <p class="empty">No races completed yet</p>
      ) : (
        <div class="tire-table">
          <div class="table-header">
            <div class="col-pos">Pos</div>
            <div class="col-brand">Team</div>
            <div class="col-points">Points</div>
          </div>
          {standings.slice(0, 8).map((entry, idx) => (
            <div class={`table-row ${idx === 0 ? 'leader' : ''}`} key={entry.team.id}>
              <div class="col-pos">{idx + 1}</div>
              <div class="col-brand">{entry.team.name}</div>
              <div class="col-points">{entry.pts}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
