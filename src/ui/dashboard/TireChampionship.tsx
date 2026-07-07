// Tire Championship - Shows which tire brand is leading in this class

import type { RiderStanding } from '../../game/state';

interface Props {
  standings: RiderStanding[];
}

export function TireChampionship({ standings }: Props) {
  // Aggregate tire brand points from all riders
  const tireBrands = new Map<string, {
    brand: string;
    points: number;
    wins: number;
    podiums: number;
  }>();

  standings.forEach(entry => {
    // Riders should have tire info if available
    const brand = entry.rider.tireId || 'Unknown';
    const existing = tireBrands.get(brand);
    if (existing) {
      existing.points += entry.points;
      existing.wins += entry.wins;
      existing.podiums += entry.podiums;
    } else {
      tireBrands.set(brand, {
        brand,
        points: entry.points,
        wins: entry.wins,
        podiums: entry.podiums,
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
            <div class="table-row" key={entry.brand}>
              <div class="col-pos">{idx + 1}</div>
              <div class="col-brand">{entry.brand}</div>
              <div class="col-points">{entry.points}</div>
              <div class="col-wins">{entry.wins}</div>
              <div class="col-podiums">{entry.podiums}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
