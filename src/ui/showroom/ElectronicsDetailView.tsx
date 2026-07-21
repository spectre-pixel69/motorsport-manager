// Electronics Detail View - Zoom view of an ECU package with lease terms

import type { ElectronicsSystem } from '../../data/setups';
import type { Team } from '../../data/types';

interface Props {
  system: ElectronicsSystem;
  team: Team;
  leased: boolean;
  onLease: () => void;
  onBack: () => void;
}

const LAUNCH_LABELS: Record<ElectronicsSystem['launchControl'], string> = {
  automatic: 'Automatic — full holeshot assist',
  manual: 'Manual — rider-armed, tuner-mapped',
  basic: 'Basic — rev limiter only',
};

const LOGGING_LABELS: Record<ElectronicsSystem['dataLogging'], string> = {
  full: 'Full telemetry — every channel recorded',
  limited: 'Limited — key channels only',
  none: 'None — no data capture',
};

export function ElectronicsDetailView({ system, team, leased, onLease, onBack }: Props) {
  const budgetRemaining = team.budget - system.yearlyLeaseCost;

  return (
    <div class="detail-view">
      <button class="btn-back" onClick={onBack}>← Back to Showroom</button>

      <div class="detail-content">
        {/* Left: System identity + bonuses */}
        <div class="detail-left">
          <div class="item-image">
            <div class="item-icon-large">💻</div>
            <h2>{system.name}</h2>
            <p class="manufacturer">ECU Package</p>
          </div>

          <div class="ovr-bonuses">
            <h4>OVR Bonuses</h4>
            {system.ovrBonus && Object.entries(system.ovrBonus).length > 0 ? (
              <div class="bonus-list">
                {Object.entries(system.ovrBonus).map(([pillar, bonus]) => (
                  <div class="bonus-row" key={pillar}>
                    <span class="pillar">{pillar}:</span>
                    <span class="bonus">+{bonus}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p class="none">No bonuses</p>
            )}
          </div>

          <div class="ovr-bonuses">
            <h4>Staff Requirement</h4>
            <div class="trait-list">
              <span class="surface-badge">Tier {system.staffTierUnlock}+ tuner</span>
            </div>
          </div>
        </div>

        {/* Center: Specs */}
        <div class="detail-center">
          <div class="stats-panel">
            <h3>System Specifications</h3>

            <div class="stat-item">
              <span class="stat-label">Reliability:</span>
              <span class="stat-value">{system.reliability} / 100</span>
            </div>
            <div class="meter"><div class="meter-fill dur" style={`width:${system.reliability}%`} /></div>

            <div class="stat-item">
              <span class="stat-label">Launch Control:</span>
              <span class="stat-value">{LAUNCH_LABELS[system.launchControl]}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Data Logging:</span>
              <span class="stat-value">{LOGGING_LABELS[system.dataLogging]}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Annual Lease:</span>
              <span class="stat-value">${system.yearlyLeaseCost.toLocaleString()}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Weekly Cost:</span>
              <span class="stat-value">${Math.round(system.yearlyLeaseCost / 52).toLocaleString()}</span>
            </div>

            <hr />

            <div class="stat-item">
              <span class="stat-label">Description:</span>
              <p class="description">{system.description}</p>
            </div>

            {system.staffTierUnlock > 1 && (
              <p class="trait-bad">
                − Requires a Tier {system.staffTierUnlock}+ electronics tech to run advanced maps —
                without one, reliability risk goes up.
              </p>
            )}
            <p class="description">
              Note: 250P Restricted runs a spec ECU by rule — aftermarket packages apply to
              350 Pro, 250 Men and Women's 250 only.
            </p>
          </div>
        </div>

        {/* Right: Lease + budget */}
        <div class="detail-right">
          <div class="purchase-section">
            <h3>Lease Terms</h3>
            <div class="stat-item">
              <span class="stat-label">Term:</span>
              <span class="stat-value">Full season</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Covers:</span>
              <span class="stat-value">All eligible classes</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Season Cost:</span>
              <span class="stat-value">${system.yearlyLeaseCost.toLocaleString()}</span>
            </div>
          </div>

          <div class="budget-tracker">
            <h4>Budget Status</h4>
            <div class="budget-row">
              <span>Team Budget:</span>
              <span>${team.budget.toLocaleString()}</span>
            </div>
            <div class="budget-row total">
              <span>After Lease:</span>
              <span class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>
                ${budgetRemaining.toLocaleString()}
              </span>
            </div>
            {budgetRemaining < 0 && (
              <div class="budget-warning">⚠️ Over budget by ${Math.abs(budgetRemaining).toLocaleString()}</div>
            )}
            <button class="btn-confirm" disabled={budgetRemaining < 0} onClick={onLease}>
              {leased ? '✓ Package Leased' : 'Lease This Package'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
