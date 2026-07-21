// Tire Championship — real tire-manufacturer standings (source of truth:
// state.standings.tires, filled by applyTirePoints from top-3 finishers).

import type { Universe } from '../../data/types';

interface Props {
  tirePoints: Record<string, number>;   // brandId -> points (state.standings.tires)
  universe: Universe;
}

export function TireChampionship({ tirePoints, universe }: Props) {
  const sorted = Object.entries(tirePoints)
    .map(([brandId, points]) => ({
      brandId,
      brandName: universe.tireBrands[brandId]?.name ?? brandId,
      points,
    }))
    .sort((a, b) => b.points - a.points);

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
          </div>
          {sorted.slice(0, 6).map((entry, idx) => (
            <div class={`table-row ${idx === 0 ? 'leader' : ''}`} key={entry.brandId}>
              <div class="col-pos">{idx + 1}</div>
              <div class="col-brand">{entry.brandName}</div>
              <div class="col-points">{entry.points}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
