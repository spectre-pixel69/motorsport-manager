// Electronics Showroom - ECU and control systems by track type

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import type { ElectronicsSystem } from '../../data/setups';
import { ELECTRONICS_SYSTEMS } from '../../data/setups';
import { ElectronicsDetailView } from './ElectronicsDetailView';
import './showroom.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

type TrackType = 'loam' | 'sand' | 'hardpack' | 'wet' | 'mixed';

const TRACK_TYPES: TrackType[] = ['loam', 'sand', 'hardpack', 'wet', 'mixed'];

export function ElectronicsShowroom({ state, onExit }: Props) {
  const [selections, setSelections] = useState<Record<TrackType, string>>({
    loam: '',
    sand: '',
    hardpack: '',
    wet: '',
    mixed: '',
  });

  const [detailSystem, setDetailSystem] = useState<ElectronicsSystem | null>(null);

  const team = state.universe.teams[state.playerTeamId];
  const systems = Object.values(ELECTRONICS_SYSTEMS);

  const handleSelectSystem = (trackType: TrackType, systemId: string) => {
    setSelections({ ...selections, [trackType]: systemId });
  };

  if (detailSystem) {
    const isLeased = Object.values(selections).some(id => id === detailSystem.id);
    return (
      <div class="showroom-container">
        <ElectronicsDetailView
          system={detailSystem}
          team={team}
          leased={isLeased}
          onLease={() => setSelections({
            loam: detailSystem.id,
            sand: detailSystem.id,
            hardpack: detailSystem.id,
            wet: detailSystem.id,
            mixed: detailSystem.id,
          })}
          onBack={() => setDetailSystem(null)}
        />
      </div>
    );
  }

  const calculateTotalCost = (): number => {
    const selectedSystems = new Set(Object.values(selections).filter(s => s));
    return Array.from(selectedSystems).reduce((sum, systemId) => {
      const system = Object.values(ELECTRONICS_SYSTEMS).find(s => s.id === systemId);
      return sum + (system?.yearlyLeaseCost || 0);
    }, 0);
  };

  const totalCost = calculateTotalCost();
  const budgetRemaining = team.budget - totalCost;

  return (
    <div class="showroom-container">
      <div class="showroom-header">
        <h1>⚡ Electronics Showroom</h1>
        <div class="showroom-info">
          <span class="budget-display">
            Total: <strong>${totalCost.toLocaleString()}</strong>
          </span>
          <button class="btn-close" onClick={onExit}>← Back</button>
        </div>
      </div>

      <div class="electronics-grid">
        {TRACK_TYPES.map(trackType => (
          <div class="electronics-section" key={trackType}>
            <h3 class="track-title">
              {trackType.charAt(0).toUpperCase() + trackType.slice(1)} Tracks
            </h3>

            <div class="electronics-options">
              {systems.map(system => (
                <div
                  class={`electronics-card ${selections[trackType] === system.id ? 'selected' : ''}`}
                  key={system.id}
                  onClick={() => handleSelectSystem(trackType, system.id)}
                >
                  <div class="system-name">{system.name}</div>
                  <div class="system-specs">
                    <div class="spec">Cost: ${(system.yearlyLeaseCost).toLocaleString()}</div>
                    <div class="spec">{system.description}</div>
                  </div>
                  {system.ovrBonus && Object.keys(system.ovrBonus).length > 0 && (
                    <div class="ovr-note">+OVR bonuses</div>
                  )}
                  <button
                    class="detail-link"
                    onClick={(e: Event) => { e.stopPropagation(); setDetailSystem(system); }}
                  >Details →</button>
                  {selections[trackType] === system.id && (
                    <div class="selected-badge">✓ Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div class="electronics-footer">
        <div class="budget-info">
          <span>Budget Remaining: <strong class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>${budgetRemaining.toLocaleString()}</strong></span>
        </div>
        <button class="btn-confirm" disabled={budgetRemaining < 0}>
          ✓ Confirm Electronics
        </button>
      </div>
    </div>
  );
}
