// Suspension Showroom - Track profile selection (not per-class purchases)

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import './showroom.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

type TrackSurface = 'loam' | 'sand' | 'hardpack' | 'wet' | 'mixed';

const TRACK_SURFACES: TrackSurface[] = ['loam', 'sand', 'hardpack', 'wet', 'mixed'];

const SUSPENSION_PROFILES = {
  loam: { name: 'Loam Track', stiffness: 'Medium', desc: 'Balanced setup for typical loam surfaces' },
  sand: { name: 'Sand Track', stiffness: 'Soft', desc: 'Compliant setup for sand absorption' },
  hardpack: { name: 'Hardpack', stiffness: 'Stiff', desc: 'Firm setup for hard-packed surfaces' },
  wet: { name: 'Wet/Muddy', stiffness: 'Medium-Soft', desc: 'Adaptive setup for wet conditions' },
  mixed: { name: 'Mixed Terrain', stiffness: 'Variable', desc: 'Transitional setup for varied surfaces' },
};

export function SuspensionShowroom({ state, onExit }: Props) {
  const [selectedProfile, setSelectedProfile] = useState<TrackSurface | null>(null);

  return (
    <div class="showroom-container">
      <div class="showroom-header">
        <h1>🔧 Suspension & Setup Showroom</h1>
        <button class="btn-close" onClick={onExit}>← Back</button>
      </div>

      <div class="suspension-grid">
        <div class="suspension-intro">
          <h2>Track Profile Selection</h2>
          <p>Select your suspension profile based on track surface conditions. You can adjust settings before each round.</p>
        </div>

        {TRACK_SURFACES.map(surface => {
          const profile = SUSPENSION_PROFILES[surface];
          return (
            <div
              class={`suspension-card ${selectedProfile === surface ? 'selected' : ''}`}
              key={surface}
              onClick={() => setSelectedProfile(surface)}
            >
              <div class="profile-name">{profile.name}</div>
              <div class="profile-stiffness">Stiffness: {profile.stiffness}</div>
              <p class="profile-description">{profile.desc}</p>
              {selectedProfile === surface && (
                <div class="selected-badge">✓ Selected</div>
              )}
            </div>
          );
        })}
      </div>

      <div class="suspension-footer">
        <div class="info-box">
          <h4>Track-Specific Tuning</h4>
          <p>Your team's suspension specialist can adjust these profiles mid-season based on track data and rider feedback.</p>
        </div>
        <button class="btn-confirm">✓ Confirm Setup Profile</button>
      </div>
    </div>
  );
}
