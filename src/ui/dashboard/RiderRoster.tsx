// Rider Roster - Shows team's riders for a class (starters + bench backup)
// Displays: Rider card with OVR, status, financial, and mental state indicators

import type { Rider, Team } from '../../data/types';

interface Props {
  riders: Rider[];
  team: Team;
  benchRiders?: Rider[];  // optional: bench riders for this class
  onSelectRider: (riderId: string) => void;
  isExpanded: boolean;
}

function StarRating({ overall }: { overall: number }) {
  const stars = Math.round((overall / 100) * 5);
  return (
    <div class="star-rating">
      <span class="ovr-number">OVR {Math.round(overall)}</span>
      <span class="stars">{'★'.repeat(Math.max(1, stars))}</span>
    </div>
  );
}

function RiderStatusBadges({ rider }: { rider: Rider }) {
  return (
    <div class="status-badges">
      {rider.injuredForRounds > 0 && (
        <span class="badge injury" title={`Injured for ${rider.injuredForRounds} more rounds`}>
          🏥 {rider.injuredForRounds}rd
        </span>
      )}
      {rider.morale > 70 && (
        <span class="badge morale-high" title="High morale — confident">
          😊
        </span>
      )}
      {rider.morale < 40 && (
        <span class="badge morale-low" title="Low morale — frustrated">
          😞
        </span>
      )}
      {rider.mental?.peakForm && (
        <span class="badge peak" title="In peak form — 3+ straight podiums">
          🔥
        </span>
      )}
      {(rider.mental?.tilt ?? 0) >= 5 && (
        <span class="badge tilt" title={`Tilt: ${rider.mental?.lastEvents?.[0] ?? 'struggling'}`}>
          😤
        </span>
      )}
      {rider.stamina < 30 && (
        <span class="badge fatigue" title="Low stamina — needs rest">
          ⚡
        </span>
      )}
    </div>
  );
}

export function RiderRoster({ riders, team, benchRiders, onSelectRider, isExpanded }: Props) {
  const hasInjuries = riders.some(r => r.injuredForRounds > 0);
  const benchAvailable = benchRiders && benchRiders.length > 0;

  return (
    <div class="rider-roster">
      <h3>Starters {riders.length > 0 && `(${riders.length})`}</h3>

      {riders.length === 0 ? (
        <div class="empty-roster">
          <p>No riders assigned to this class</p>
          <button class="btn-secondary">+ Draft Rider</button>
        </div>
      ) : (
        <div class="roster-list">
          {riders.map(rider => (
            <div
              class={`rider-card ${rider.injuredForRounds > 0 ? 'injured-starter' : ''}`}
              key={rider.id}
              onClick={() => onSelectRider(rider.id)}
              style="cursor:pointer"
            >
              {/* Rider Avatar with Name Overlay */}
              <div class="rider-avatar">
                <div class="avatar-placeholder">
                  #{rider.number}
                </div>
                <div class="rider-name-overlay">{rider.name}</div>
              </div>

              {/* OVR Rating */}
              <div class="rider-rating">
                <StarRating overall={rider.overall} />
              </div>

              {/* Status badges */}
              <RiderStatusBadges rider={rider} />

              {/* Financial Info */}
              <div class="rider-financials">
                <div class="financial-item">
                  <span class="label">Salary</span>
                  <span class="value">${(rider.salary / 52 / 1000).toFixed(0)}k/wk</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bench Riders Section */}
      {benchAvailable && (
        <>
          <h3 style="margin-top: 12px">Bench Ready {benchRiders!.length > 0 && `(${benchRiders!.length})`}</h3>
          <div class="roster-list bench">
            {benchRiders!.map(rider => (
              <div
                class="rider-card bench-rider"
                key={rider.id}
                onClick={() => onSelectRider(rider.id)}
                style="cursor:pointer"
              >
                <div class="rider-avatar">
                  <div class="avatar-placeholder muted">#{rider.number}</div>
                  <div class="rider-name-overlay">{rider.name}</div>
                </div>
                <div class="rider-rating">
                  <StarRating overall={rider.overall} />
                </div>
                <div class="bench-note">💺 Ready to sub in</div>
                <div class="rider-financials">
                  <div class="financial-item">
                    <span class="label">Retainer</span>
                    <span class="value">$50k/wk</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasInjuries && (
        <p class="injury-notice">⚠️ Starter injury detected — bench rider can substitute. Verify substitution in race planning.</p>
      )}
    </div>
  );
}
