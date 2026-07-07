// Free Agents - Mid-season rider pickup available

import type { Rider, Universe } from '../../data/types';

interface Props {
  universe: Universe;
  onClose: () => void;
  onSign?: (riderId: string) => void;
}

export function FreeAgents({ universe, onClose, onSign }: Props) {
  // Get all riders with status "available" or bench status
  const freeAgents = Object.values(universe.riders).filter(r => {
    // In a full system, would check for benched/injured/released status
    // For now, just show unassigned riders
    return !r.teamId || r.teamId === '';
  });

  const handleSign = (riderId: string) => {
    onSign?.(riderId);
  };

  return (
    <div class="modal-content">
      <div class="modal-header">
        <h2>Free Agents</h2>
        <button class="modal-close" onClick={onClose}>✕</button>
      </div>

      <div class="modal-body">
        {freeAgents.length === 0 ? (
          <div class="empty-state">
            <p>No free agents available</p>
          </div>
        ) : (
          <div class="free-agents-table">
            <div class="table-header">
              <div class="col-name">Name</div>
              <div class="col-ovr">OVR</div>
              <div class="col-age">Age</div>
              <div class="col-pace">Pace</div>
              <div class="col-starts">Starts</div>
              <div class="col-action">Action</div>
            </div>
            {freeAgents.slice(0, 20).map(rider => (
              <div class="table-row" key={rider.id}>
                <div class="col-name">
                  <span class="number">#{rider.number}</span>
                  {rider.name}
                </div>
                <div class="col-ovr">
                  <strong>{Math.round(rider.overall)}</strong>
                </div>
                <div class="col-age">{rider.age}</div>
                <div class="col-pace">{Math.round(rider.stats.pace)}</div>
                <div class="col-starts">{Math.round(rider.stats.starts)}</div>
                <div class="col-action">
                  <button class="btn-sign" onClick={() => handleSign(rider.id)}>
                    Sign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
