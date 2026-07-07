// Rider Roster - Shows team's riders for a class (max 2)

import type { Rider, Team } from '../../data/universe';

interface Props {
  riders: Rider[];
  team: Team;
  onSelectRider: (riderId: string) => void;
  isExpanded: boolean;
}

export function RiderRoster({ riders, team, onSelectRider, isExpanded }: Props) {
  return (
    <div class="rider-roster">
      <h3>Rider Roster</h3>

      {riders.length === 0 ? (
        <div class="empty-roster">
          <p>No riders assigned to this class</p>
          <button class="btn-secondary">+ Draft Rider</button>
        </div>
      ) : (
        <div class="roster-list">
          {riders.map(rider => (
            <div class="rider-card" key={rider.id} onClick={() => onSelectRider(rider.id)}>
              <div class="rider-header">
                <div class="rider-name" style={{ cursor: 'pointer' }}>
                  {rider.name}
                </div>
                <div class="rider-number">{rider.number}</div>
              </div>

              <div class="rider-stats">
                <div class="stat">
                  <span class="stars">{'★'.repeat(Math.floor(rider.overall))}</span>
                  <span class="rating">OVR {rider.overall}</span>
                </div>
              </div>

              <div class="rider-financials">
                <div class="financial-item">
                  <span class="label">Weekly Salary</span>
                  <span class="value">${(rider.salary / 52).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div class="financial-item">
                  <span class="label">Season Earnings</span>
                  <span class="value">${(rider.earnedThisSeason || 0).toLocaleString()}</span>
                </div>
              </div>

              {rider.injuredForRounds > 0 && (
                <div class="status injured">INJURED - {rider.injuredForRounds} rounds</div>
              )}

              <button class="btn-setup">⚙ Setup</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
