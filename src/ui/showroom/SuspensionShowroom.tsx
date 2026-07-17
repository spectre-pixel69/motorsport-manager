// Suspension Showroom - Track profile selection (not per-class purchases)

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import type { TrackSurface } from '../../data/setups';
import { SUSPENSION_PRESETS } from '../../data/setups';
import { SuspensionDetailView } from './SuspensionDetailView';
import './showroom.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

const TRACK_SURFACES: TrackSurface[] = ['loam', 'sand', 'hardpack', 'wet', 'mixed'];

const SUSPENSION_PROFILES = {
  loam: { name: 'Loam Track', stiffness: 'Medium', desc: 'Balanced setup for typical loam surfaces' },
  sand: { name: 'Sand Track', stiffness: 'Soft', desc: 'Compliant setup for sand absorption' },
  hardpack: { name: 'Hardpack', stiffness: 'Stiff', desc: 'Firm setup for hard-packed surfaces' },
  wet: { name: 'Wet/Muddy', stiffness: 'Medium-Soft', desc: 'Adaptive setup for wet conditions' },
  mixed: { name: 'Mixed Terrain', stiffness: 'Variable', desc: 'Transitional setup for varied surfaces' },
};

// Map showroom surface -> tuning preset in data/setups.ts
const PRESET_KEYS: Record<TrackSurface, string> = {
  loam: 'loam-standard',
  sand: 'sand-compliant',
  hardpack: 'hardpack-stiff',
  wet: 'wet-recovery',
  mixed: 'mixed-balanced',
};

export function SuspensionShowroom({ state, onExit }: Props) {
  const [selectedProfile, setSelectedProfile] = useState<TrackSurface | null>(null);
  const [detailSurface, setDetailSurface] = useState<TrackSurface | null>(null);

  if (detailSurface) {
    return (
      <div class="showroom-container">
        <SuspensionDetailView
          surface={detailSurface}
          displayName={SUSPENSION_PROFILES[detailSurface].name}
          preset={SUSPENSION_PRESETS[PRESET_KEYS[detailSurface]]}
          selected={selectedProfile === detailSurface}
          onSelect={() => setSelectedProfile(detailSurface)}
          onBack={() => setDetailSurface(null)}
        />
      </div>
    );
  }

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
              <button
                class="detail-link"
                onClick={(e: Event) => { e.stopPropagation(); setDetailSurface(surface); }}
              >Details →</button>
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
