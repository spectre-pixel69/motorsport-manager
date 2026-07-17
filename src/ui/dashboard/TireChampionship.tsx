// Tire Championship - Shows which tire brand is leading in this class

import type { Rider, Universe } from '../../data/types';

interface StandingEntry {
  rider: Rider;
  pts: number;
}

interface Props {
  standings: StandingEntry[];
  universe: Universe;
}

export function TireChampionship({ standings, universe }: Props) {
  // Aggregate tire brand points from all riders based on their team's tire brand
  const tireBrands = new Map<string, {
    brandId: string;
    brandName: string;
    points: number;
  }>();

  standings.forEach(entry => {
    if (!entry.rider.teamId) return;

    const team = universe.teams[entry.rider.teamId];
    if (!team) return;

    const brand = universe.tireBrands[team.tireBrandId];
    const brandId = team.tireBrandId;
    const brandName = brand?.name || 'Unknown';

    const existing = tireBrands.get(brandId);
    if (existing) {
      existing.points += entry.pts;
    } else {
      tireBrands.set(brandId, {
        brandId,
        brandName,
        points: entry.pts,
      });
    }
  });

  const sorted = Array.from(tireBrands.values()).sort((a, b) => b.points - a.points);

  return (
    <div class="tire-championship">
      <h3>Tire Championship</h3>

      {sorted.length === 0 ? (
        <p class="empty">No data</p>
      ) : (
        <div class="tire-table">
          <div class="table-header">
            <div class="col-pos">Pos</div>
            <div class="col-brand">Tire Brand</div>
            <div class="col-points">Points</div>
            <div class="col-wins">Wins</div>
            <div class="col-podiums">Podiums</div>
          </div>
          {sorted.slice(0, 6).map((entry, idx) => (
            <div class="table-row" key={entry.brandId}>
              <div class="col-pos">{idx + 1}</div>
              <div class="col-brand">{entry.brandName}</div>
              <div class="col-points">{entry.points}</div>
              <div class="col-wins">—</div>
              <div class="col-podiums">—</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
