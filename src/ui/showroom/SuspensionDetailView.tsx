// Suspension Detail View - Zoom view of a track profile's clicker settings

import type { SuspensionSetup, TrackSurface } from '../../data/setups';

interface Props {
  surface: TrackSurface;
  displayName: string;
  preset: SuspensionSetup;
  selected: boolean;
  onSelect: () => void;
  onBack: () => void;
}

export function SuspensionDetailView({ surface, displayName, preset, selected, onSelect, onBack }: Props) {
  const fatiguePct = Math.round(preset.riderFatigueFactor * 100);
  const fatigueNote = preset.riderFatigueFactor > 1
    ? 'Harsh — drains rider stamina faster than baseline'
    : preset.riderFatigueFactor < 1
      ? 'Compliant — saves rider energy over a moto'
      : 'Neutral — baseline energy cost';

  return (
    <div class="detail-view">
      <button class="btn-back" onClick={onBack}>← Back to Showroom</button>

      <div class="detail-content">
        {/* Left: Profile identity */}
        <div class="detail-left">
          <div class="item-image">
            <div class="item-icon-large">🔩</div>
            <h2>{displayName}</h2>
            <p class="manufacturer">{surface} surface profile</p>
          </div>

          <div class="ovr-bonuses">
            <h4>OVR Bonuses</h4>
            {preset.ovrBonus && Object.entries(preset.ovrBonus).length > 0 ? (
              <div class="bonus-list">
                {Object.entries(preset.ovrBonus).map(([pillar, bonus]) => (
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
            <h4>Damping Mode</h4>
            <div class="trait-list">
              <span class="surface-badge">{preset.mode}</span>
            </div>
          </div>
        </div>

        {/* Center: Clicker settings */}
        <div class="detail-center">
          <div class="stats-panel">
            <h3>Clicker Settings</h3>

            <div class="stat-item">
              <span class="stat-label">Compression:</span>
              <span class="stat-value">{preset.compression} / 100</span>
            </div>
            <div class="meter"><div class="meter-fill grip" style={`width:${preset.compression}%`} /></div>

            <div class="stat-item">
              <span class="stat-label">Rebound:</span>
              <span class="stat-value">{preset.rebound} / 100</span>
            </div>
            <div class="meter"><div class="meter-fill dur" style={`width:${preset.rebound}%`} /></div>

            <div class="stat-item">
              <span class="stat-label">Spring Rate:</span>
              <span class="stat-value">{preset.springRate} / 100</span>
            </div>
            <div class="meter"><div class="meter-fill wear" style={`width:${preset.springRate}%`} /></div>

            <hr />

            <div class="stat-item">
              <span class="stat-label">Rider Fatigue Factor:</span>
              <span class="stat-value">{fatiguePct}% of baseline</span>
            </div>
            <p class="description">{fatigueNote}</p>

            <div class="stat-item">
              <span class="stat-label">When to Run It:</span>
            </div>
            <p class="description">
              Default clickers for {surface} rounds. Your suspension specialist can fine-tune
              compression and rebound off rider feedback before each round — this profile sets
              the baseline the truck rolls in with.
            </p>
          </div>
        </div>

        {/* Right: Apply */}
        <div class="detail-right">
          <div class="purchase-section">
            <h3>Profile Assignment</h3>
            <div class="stat-item">
              <span class="stat-label">Applies To:</span>
              <span class="stat-value">All {surface} rounds</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Cost:</span>
              <span class="stat-value">Included — crew labor</span>
            </div>
            <p class="description">
              Profiles carry no lease cost; they use your existing suspension hardware.
              Setup quality scales with your crew's suspension specialty.
            </p>
          </div>

          <div class="budget-tracker">
            <h4>Confirm</h4>
            <button class="btn-confirm" onClick={onSelect}>
              {selected ? '✓ Profile Set as Default' : 'Set as Default Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
