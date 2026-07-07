// Tire Championship - Shows which tire brand is leading in this class

interface StandingEntry {
  rider: any;
  pts: number;
}

interface Props {
  standings: StandingEntry[];
}

export function TireChampionship({ standings }: Props) {
  // Aggregate tire brand points from all riders
  const tireBrands = new Map<string, {
    brand: string;
    points: number;
  }>();

  standings.forEach(entry => {
    // Riders should have tire info if available
    const brand = entry.rider.tireId || 'Unknown';
    const existing = tireBrands.get(brand);
    if (existing) {
      existing.points += entry.pts;
    } else {
      tireBrands.set(brand, {
        brand,
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
            <div class="table-row" key={entry.brand}>
              <div class="col-pos">{idx + 1}</div>
              <div class="col-brand">{entry.brand}</div>
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
