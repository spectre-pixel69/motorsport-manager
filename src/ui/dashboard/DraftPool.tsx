// Draft Pool - Pre-season rider acquisition from available pool

import type { Rider, Universe } from '../../data/types';

interface Props {
  universe: Universe;
  onClose: () => void;
  onDraft?: (riderId: string) => void;
}

export function DraftPool({ universe, onClose, onDraft }: Props) {
  // Get all riders not on a team (available for draft)
  const availableRiders = Object.values(universe.riders).filter(
    r => !r.teamId || r.teamId === ''
  );

  const handleDraft = (riderId: string) => {
    onDraft?.(riderId);
  };

  return (
    <div class="modal-content">
      <div class="modal-header">
        <h2>Draft Pool</h2>
        <button class="modal-close" onClick={onClose}>✕</button>
      </div>

      <div class="modal-body">
        {availableRiders.length === 0 ? (
          <div class="empty-state">
            <p>No riders available in draft pool</p>
          </div>
        ) : (
          <div class="riders-grid">
            {availableRiders.map(rider => (
              <div class="rider-option" key={rider.id}>
                <div class="rider-info">
                  <div class="rider-header-row">
                    <span class="rider-name">{rider.name}</span>
                    <span class="rider-number">#{rider.number}</span>
                  </div>
                  <div class="rider-stats-row">
                    <span class="age">{rider.age}y</span>
                    <span class="nationality">{rider.nationality}</span>
                    <span class="ovr">OVR {Math.round(rider.overall)}</span>
                  </div>
                  <div class="rider-attributes">
                    <span>Pace: {Math.round(rider.stats.pace)}</span>
                    <span>Starts: {Math.round(rider.stats.starts)}</span>
                    <span>Consistency: {Math.round(rider.stats.consistency)}</span>
                  </div>
                </div>
                <button class="btn-draft" onClick={() => handleDraft(rider.id)}>
                  Draft
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
