// Parts Manager — bike component reliability, wear, and failure monitoring
// Monitor failure risk, manage rebuilds, select engine modes

import { useState } from 'preact/hooks';
import type { BikeComponent, BikeSetup, EngineMode } from '../../data/types';
import { calculateFailureChance, estimateRebuildCost, ENGINE_MODE_MULTIPLIERS, ENGINE_MODE_PACE } from '../../game/reliability';
import './garage.css';

interface Props {
  bikeSetup: BikeSetup;
  teamBudget: number;
  hasRecklessRider: boolean;
  reliabilityRdLevel: number;
  crewQuality: number;
  baseEngineCost: number;
  onEngineModChange: (mode: EngineMode) => void;
  onRebuild: (componentType: string) => void;
  onClose: () => void;
}

const ENGINE_MODES: EngineMode[] = ['conserve', 'standard', 'push', 'attack'];

const ENGINE_MODE_INFO: Record<EngineMode, string> = {
  conserve: 'Lowest failure risk, reduced pace',
  standard: 'Balanced pace and reliability',
  push: 'Higher pace, elevated failure risk',
  attack: 'Maximum pace, extreme failure risk',
};

export function PartsManager({
  bikeSetup,
  teamBudget,
  hasRecklessRider,
  reliabilityRdLevel,
  crewQuality,
  baseEngineCost,
  onEngineModChange,
  onRebuild,
  onClose,
}: Props) {
  const [selectedComponent, setSelectedComponent] = useState<BikeComponent | null>(
    Object.values(bikeSetup.components)[0] ?? null
  );

  const components = Object.values(bikeSetup.components);

  if (!selectedComponent || components.length === 0) {
    return (
      <div class="parts-manager">
        <button class="btn-close" onClick={onClose}>← Back</button>
        <p>No components to manage.</p>
      </div>
    );
  }

  const failChance = calculateFailureChance(
    selectedComponent,
    bikeSetup.engineMode,
    false,
    hasRecklessRider,
    reliabilityRdLevel,
    crewQuality,
  );

  const rebuildCost = estimateRebuildCost(selectedComponent, baseEngineCost);
  const canAffordRebuild = teamBudget >= rebuildCost;

  return (
    <div class="parts-manager">
      <div class="garage-header">
        <h2>🔧 Garage & Parts</h2>
        <button class="btn-close" onClick={onClose}>← Back</button>
      </div>

      <div class="garage-content">
        {/* Engine Mode Selection */}
        <div class="engine-mode-panel">
          <h3>Engine Mode</h3>
          <div class="mode-selector">
            {ENGINE_MODES.map(mode => {
              const paceDelta = ENGINE_MODE_PACE[mode];
              const paceLabel = paceDelta === 0
                ? 'baseline pace'
                : `${paceDelta < 0 ? '' : '+'}${paceDelta.toFixed(2)}s/lap`;
              return (
                <div key={mode} class="mode-option">
                  <button
                    class={`mode-btn ${bikeSetup.engineMode === mode ? 'active' : ''}`}
                    onClick={() => onEngineModChange(mode)}
                  >
                    {mode.toUpperCase()}
                  </button>
                  <div class="mode-info">{ENGINE_MODE_INFO[mode]}</div>
                  <div class="mode-tradeoff">
                    <span class={paceDelta < 0 ? 'pace-fast' : paceDelta > 0 ? 'pace-slow' : 'pace-neutral'}>
                      {paceLabel}
                    </span>
                    <span class="wear-mult">×{ENGINE_MODE_MULTIPLIERS[mode].toFixed(1)} wear/risk</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Components List */}
        <div class="components-list">
          <h3>Bike Components</h3>
          <div class="component-cards">
            {components.map(comp => (
              <div
                key={comp.id}
                class={`component-card ${selectedComponent?.id === comp.id ? 'active' : ''}`}
                onClick={() => setSelectedComponent(comp)}
              >
                <div class="component-name">{comp.type.toUpperCase()}</div>

                {/* Reliability Bar */}
                <div class="reliability-bar">
                  <div
                    class="reliability-fill"
                    style={{
                      width: `${comp.reliability}%`,
                      backgroundColor: comp.reliability > 70 ? '#2ecc71' : comp.reliability > 40 ? '#f39c12' : '#e74c3c',
                    }}
                  />
                </div>
                <div class="reliability-label">
                  Reliability: {Math.round(comp.reliability)}
                </div>

                {/* Wear Bar */}
                <div class="wear-bar">
                  <div
                    class="wear-fill"
                    style={{
                      width: `${comp.wear}%`,
                      backgroundColor: comp.wear > 70 ? '#e74c3c' : comp.wear > 40 ? '#f39c12' : '#3498db',
                    }}
                  />
                </div>
                <div class="wear-label">
                  Wear: {Math.round(comp.wear)}%
                </div>

                {/* Failure Chance Quick View */}
                <div class="failure-chance">
                  {Math.round(calculateFailureChance(
                    comp,
                    bikeSetup.engineMode,
                    false,
                    hasRecklessRider,
                    reliabilityRdLevel,
                    crewQuality,
                  ) * 10) / 10}% fail risk
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Component Detail */}
        {selectedComponent && (
          <div class="component-detail">
            <h3>{selectedComponent.type.toUpperCase()} — Details</h3>

            <div class="detail-stats">
              <div class="stat">
                <span class="label">Reliability (Base):</span>
                <div class="stat-bar-wrapper">
                  <div class="stat-bar">
                    <div
                      class="stat-bar-fill"
                      style={{
                        width: `${selectedComponent.reliability}%`,
                        backgroundColor: '#3498db',
                      }}
                    />
                  </div>
                  <span class="stat-value">{Math.round(selectedComponent.reliability)}/100</span>
                </div>
              </div>

              <div class="stat">
                <span class="label">Current Wear:</span>
                <div class="stat-bar-wrapper">
                  <div class="stat-bar">
                    <div
                      class="stat-bar-fill"
                      style={{
                        width: `${selectedComponent.wear}%`,
                        backgroundColor: selectedComponent.wear > 70 ? '#e74c3c' : selectedComponent.wear > 40 ? '#f39c12' : '#2ecc71',
                      }}
                    />
                  </div>
                  <span class="stat-value">{Math.round(selectedComponent.wear)}%</span>
                </div>
              </div>

              <div class="stat">
                <span class="label">Failure Chance (current mode):</span>
                <div class="failure-chance-detail">
                  <span class="chance-value">{Math.round(failChance * 10) / 10}%</span>
                  <div class="chance-breakdown">
                    • Base: {Math.round(calculateFailureChance(selectedComponent, 'standard', false, false, 0, 1) * 10) / 10}%
                    • Mode: {bikeSetup.engineMode}
                    • Wear: ×{(1 + (selectedComponent.wear / 100) * 0.8).toFixed(2)}
                  </div>
                </div>
              </div>

              <div class="stat">
                <span class="label">Total Mileage:</span>
                <span class="stat-value">{Math.round(selectedComponent.mileageMiles)} miles</span>
              </div>

              {selectedComponent.lastRebuild && (
                <div class="stat">
                  <span class="label">Last Rebuild:</span>
                  <span class="stat-value">Round {selectedComponent.lastRebuild}</span>
                </div>
              )}
            </div>

            {/* Rebuild Option */}
            <div class="rebuild-section">
              <h4>Maintenance</h4>
              <div class="rebuild-info">
                <p>Rebuild this component to reset wear to 0% and restore reliability.</p>
                <div class="cost-display">
                  Cost: <span class="cost">${rebuildCost.toLocaleString()}</span>
                </div>
              </div>
              <button
                class="btn-rebuild"
                disabled={!canAffordRebuild}
                onClick={() => onRebuild(selectedComponent.type)}
              >
                🔧 Rebuild Component
              </button>
              {!canAffordRebuild && (
                <div class="budget-warning">
                  Insufficient budget. Need ${(rebuildCost - teamBudget).toLocaleString()} more.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
