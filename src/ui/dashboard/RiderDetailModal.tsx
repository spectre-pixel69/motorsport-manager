// Rider Detail Modal - Comprehensive rider profile popup
// Shows OVR pillars, career stats, strengths/weaknesses, biography

import type { Rider, Universe } from '../../data/types';

interface Props {
  rider: Rider;
  universe: Universe;
  onClose: () => void;
}

function PillarBar({ label, value }: { label: string; value: number }) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <div class="pillar-bar">
      <span class="pillar-label">{label}</span>
      <div class="pillar-track">
        <div class="pillar-fill" style={{ width: `${percent}%` }} />
      </div>
      <span class="pillar-value">{Math.round(value)}</span>
    </div>
  );
}

function OVRPillars({ rider }: { rider: Rider }) {
  return (
    <div class="ovr-pillars">
      <h3>OVR Breakdown</h3>
      <div class="pillar-list">
        <PillarBar label="Style/Scrub" value={rider.stats.pace} />
        <PillarBar label="Technical Line" value={rider.stats.consistency} />
        <PillarBar label="Start Gate Jump" value={rider.stats.starts} />
        <PillarBar label="Race Endurance" value={rider.stats.fitness} />
        <PillarBar label="Track Awareness" value={rider.stats.wet} />
      </div>
    </div>
  );
}

function CareerStats({ rider }: { rider: Rider }) {
  return (
    <div class="career-stats">
      <h3>Career Performance</h3>
      <div class="stats-grid">
        <div class="stat-block">
          <span class="stat-label">Wins</span>
          <span class="stat-value">{rider.careerWins}</span>
        </div>
        <div class="stat-block">
          <span class="stat-label">Podiums</span>
          <span class="stat-value">{rider.careerPodiums}</span>
        </div>
        <div class="stat-block">
          <span class="stat-label">Championships</span>
          <span class="stat-value">{rider.championships}</span>
        </div>
        <div class="stat-block">
          <span class="stat-label">Legacy Plate</span>
          <span class="stat-value">{rider.legacyPlate === 'none' ? '—' : rider.legacyPlate}</span>
        </div>
      </div>
    </div>
  );
}

function StrengthsWeaknesses({ rider }: { rider: Rider }) {
  const strengths = [];
  const weaknesses = [];

  // Determine strengths based on pillar performance
  if (rider.stats.pace > 75) strengths.push('Raw Speed');
  if (rider.stats.consistency > 75) strengths.push('Consistency');
  if (rider.stats.starts > 75) strengths.push('Gate Jumping');
  if (rider.stats.fitness > 75) strengths.push('Race Fitness');
  if (rider.stats.wet > 75) strengths.push('Wet Weather');
  if (rider.stats.aggression > 70) strengths.push('Overtaking');

  // Determine weaknesses
  if (rider.stats.pace < 50) weaknesses.push('Limited Speed');
  if (rider.stats.consistency < 50) weaknesses.push('Inconsistency');
  if (rider.stats.starts < 50) weaknesses.push('Poor Starts');
  if (rider.stats.fitness < 50) weaknesses.push('Late-Race Fade');
  if (rider.stats.wet < 50) weaknesses.push('Wet Weather Struggles');
  if (rider.stats.aggression > 85) weaknesses.push('Crash Risk');

  return (
    <div class="strengths-weaknesses">
      <div class="column">
        <h4>Strengths</h4>
        <div class="tags">
          {strengths.length > 0 ? (
            strengths.map(s => <span class="tag strength" key={s}>{s}</span>)
          ) : (
            <span class="placeholder">—</span>
          )}
        </div>
      </div>
      <div class="column">
        <h4>Weaknesses</h4>
        <div class="tags">
          {weaknesses.length > 0 ? (
            weaknesses.map(w => <span class="tag weakness" key={w}>{w}</span>)
          ) : (
            <span class="placeholder">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function RiderDetailModal({ rider, universe, onClose }: Props) {
  const potentialStar = Math.round((rider.potential / 100) * 5);
  const overallStar = Math.round((rider.overall / 100) * 5);

  return (
    <div class="rider-detail-modal">
      <div class="modal-header">
        <div class="rider-header-top">
          <div class="rider-number">#{rider.number}</div>
          <div class="rider-name-big">{rider.name}</div>
          <div class="rider-nationality">{rider.nationality}</div>
        </div>
        <div class="rider-header-stats">
          <div class="header-stat">
            <span class="label">Age</span>
            <span class="value">{rider.age}</span>
          </div>
          <div class="header-stat">
            <span class="label">OVR</span>
            <span class="value">
              {Math.round(rider.overall)}
              <span class="stars">{'★'.repeat(Math.max(1, overallStar))}</span>
            </span>
          </div>
          <div class="header-stat">
            <span class="label">Potential</span>
            <span class="value">
              {Math.round(rider.potential)}
              <span class="stars">{'★'.repeat(Math.max(1, potentialStar))}</span>
            </span>
          </div>
          <div class="header-stat">
            <span class="label">Salary</span>
            <span class="value">${Math.round(rider.salary).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div class="modal-content">
        <div class="left-column">
          <OVRPillars rider={rider} />
          <CareerStats rider={rider} />
        </div>

        <div class="right-column">
          <StrengthsWeaknesses rider={rider} />

          <div class="morale-section">
            <h3>Current Status</h3>
            <div class="status-item">
              <span class="label">Morale</span>
              <div class="morale-bar">
                <div class="morale-fill" style={{ width: `${rider.morale}%` }} />
              </div>
              <span class="value">{Math.round(rider.morale)}%</span>
            </div>
            {rider.injuredForRounds > 0 && (
              <div class="status-injury">
                🏥 Injured for {rider.injuredForRounds} round{rider.injuredForRounds !== 1 ? 's' : ''}
              </div>
            )}
            {rider.bench && (
              <div class="status-bench">
                📋 Reserve/Bench Rider
              </div>
            )}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
