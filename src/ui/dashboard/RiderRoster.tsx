// Rider Roster - Shows team's riders for a class (max 2)
// Displays: Rider name on avatar + OVR numeric + star rating

import type { Rider, Team } from '../../data/types';

interface Props {
  riders: Rider[];
  team: Team;
  onSelectRider: (riderId: string) => void;
  isExpanded: boolean;
}

function StarRating({ overall }: { overall: number }) {
  // Option 3: Numeric + stars (e.g., "OVR 87" with visual stars)
  // Map 0-100 OVR to 0-5 stars for display
  const stars = Math.round((overall / 100) * 5);
  return (
    <div class="star-rating">
      <span class="ovr-number">OVR {Math.round(overall)}</span>
      <span class="stars">{'★'.repeat(Math.max(1, stars))}</span>
    </div>
  );
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
              {/* Rider Avatar with Name Overlay */}
              <div class="rider-avatar">
                <div class="avatar-placeholder">
                  #{rider.number}
                </div>
                <div class="rider-name-overlay">{rider.name}</div>
              </div>

              {/* OVR Rating: Numeric + Stars */}
              <div class="rider-rating">
                <StarRating overall={rider.overall} />
              </div>

              {/* Financial Info */}
              <div class="rider-financials">
                <div class="financial-item">
                  <span class="label">Weekly Salary</span>
                  <span class="value">${(rider.salary / 52).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Status & Action */}
              {rider.injuredForRounds > 0 && (
                <div class="status injured">🏥 {rider.injuredForRounds}rd</div>
              )}

              <button class="btn-setup">⚙ Setup</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
