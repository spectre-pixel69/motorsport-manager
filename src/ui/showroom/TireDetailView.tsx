// Tire Detail View - Zoom view with compound stats and season supply planner

import { useState } from 'preact/hooks';
import type { Tire } from '../../data/bikes';
import type { Team } from '../../data/types';

interface Props {
  tire: Tire;
  team: Team;
  selected: boolean;
  onSelect: () => void;
  onBack: () => void;
}

const SEASON_ROUNDS = 20;

export function TireDetailView({ tire, team, selected, onSelect, onBack }: Props) {
  const [setsPerRound, setSetsPerRound] = useState(3);

  const seasonCost = tire.costPerSet * setsPerRound * SEASON_ROUNDS;
  const budgetRemaining = team.budget - seasonCost;
  // Effective life per set shrinks as wearRate rises
  const motosPerSet = Math.max(1, Math.round((1 / tire.wearRate) * 2.2));

  return (
    <div class="detail-view">
      <button class="btn-back" onClick={onBack}>← Back to Showroom</button>

      <div class="detail-content">
        {/* Left: Tire visualization + bonuses */}
        <div class="detail-left">
          <div class="item-image">
            <div class="item-icon-large">🛞</div>
            <h2>{tire.name}</h2>
            <p class="manufacturer">{tire.manufacturer}</p>
          </div>

          <div class="ovr-bonuses">
            <h4>OVR Bonuses</h4>
            {tire.ovrBonus && Object.entries(tire.ovrBonus).length > 0 ? (
              <div class="bonus-list">
                {Object.entries(tire.ovrBonus).map(([pillar, bonus]) => (
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
            <h4>Best Surfaces</h4>
            <div class="trait-list">
              {tire.bestForSurface.map(s => (
                <span class="surface-badge" key={s}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Compound specs */}
        <div class="detail-center">
          <div class="stats-panel">
            <h3>Compound Specifications</h3>

            <div class="stat-item">
              <span class="stat-label">Grip Rating:</span>
              <span class="stat-value">{tire.gripRating} / 100</span>
            </div>
            <div class="meter"><div class="meter-fill grip" style={`width:${tire.gripRating}%`} /></div>

            <div class="stat-item">
              <span class="stat-label">Durability:</span>
              <span class="stat-value">{tire.durability} / 100</span>
            </div>
            <div class="meter"><div class="meter-fill dur" style={`width:${tire.durability}%`} /></div>

            <div class="stat-item">
              <span class="stat-label">Wear Rate:</span>
              <span class="stat-value">{Math.round(tire.wearRate * 100)}% — ~{motosPerSet} motos/set</span>
            </div>
            <div class="meter"><div class="meter-fill wear" style={`width:${Math.round(tire.wearRate * 100)}%`} /></div>

            <div class="stat-item">
              <span class="stat-label">Cost per Set:</span>
              <span class="stat-value">${tire.costPerSet.toLocaleString()}</span>
            </div>

            <hr />

            <div class="stat-item">
              <span class="stat-label">Description:</span>
              <p class="description">{tire.description}</p>
            </div>

            <div class="stat-item">
              <span class="stat-label">Strengths:</span>
            </div>
            {tire.strengths.map(s => (
              <p class="trait-good" key={s}>+ {s}</p>
            ))}

            <div class="stat-item">
              <span class="stat-label">Weaknesses:</span>
            </div>
            {tire.weaknesses.map(w => (
              <p class="trait-bad" key={w}>− {w}</p>
            ))}
          </div>
        </div>

        {/* Right: Season supply planner */}
        <div class="detail-right">
          <div class="purchase-section">
            <h3>Season Supply Plan</h3>
            <div class="stat-item">
              <span class="stat-label">Sets per Round:</span>
              <span class="stat-value">
                {[2, 3, 4].map(n => (
                  <button
                    key={n}
                    class={`qty-btn ${setsPerRound === n ? 'active' : ''}`}
                    onClick={() => setSetsPerRound(n)}
                  >{n}</button>
                ))}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Rounds:</span>
              <span class="stat-value">{SEASON_ROUNDS}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Season Cost:</span>
              <span class="stat-value">${seasonCost.toLocaleString()}</span>
            </div>
          </div>

          <div class="budget-tracker">
            <h4>Budget Status</h4>
            <div class="budget-row">
              <span>Team Budget:</span>
              <span>${team.budget.toLocaleString()}</span>
            </div>
            <div class="budget-row total">
              <span>After Supply Deal:</span>
              <span class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>
                ${budgetRemaining.toLocaleString()}
              </span>
            </div>
            {budgetRemaining < 0 && (
              <div class="budget-warning">⚠️ Over budget by ${Math.abs(budgetRemaining).toLocaleString()}</div>
            )}
            <button class="btn-confirm" disabled={budgetRemaining < 0} onClick={onSelect}>
              {selected ? '✓ Supplier Selected' : 'Select as Supplier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
