// Draft Pool - Pre-season rider acquisition from available pool

import { useState } from 'preact/hooks';
import type { Rider, Universe } from '../../data/types';
import { draftRider } from '../../api/client';

interface Props {
  universe: Universe;
  teamId: string;
  classId: string;
  onClose: () => void;
  onDraft?: (riderId: string) => void;
}

export function DraftPool({ universe, teamId, classId, onClose, onDraft }: Props) {
  const [drafting, setDrafting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Available for draft: unassigned riders, best first, capped so the strongest
  // prospects surface instead of being buried in an unbounded list.
  const availableRiders = Object.values(universe.riders)
    .filter(r => !r.teamId || r.teamId === '')
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 30);

  const handleDraft = async (riderId: string) => {
    setDrafting(riderId);
    setError(null);
    try {
      const result = await draftRider(teamId, riderId, classId);
      if (result.success) {
        onDraft?.(riderId);
        onClose();
      } else {
        setError(result.error || 'Failed to draft rider');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setDrafting(null);
    }
  };

  return (
    <div class="modal-content">
      <div class="modal-header">
        <h2>Draft Pool</h2>
        <button class="modal-close" onClick={onClose}>✕</button>
      </div>

      <div class="modal-body">
        {error && <div class="error-banner">{error}</div>}

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
                    <span class="rider-name">
                      {rider.name}
                      {rider.age <= 21 && <span class="prospect-tag" title="Young prospect — room to develop">★ Prospect</span>}
                    </span>
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
                <button
                  class="btn-draft"
                  onClick={() => handleDraft(rider.id)}
                  disabled={drafting === rider.id}
                >
                  {drafting === rider.id ? '...' : 'Draft'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
