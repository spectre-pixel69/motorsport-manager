// Engine Detail View - Zoom view with stats and multi-class purchase options

import type { Engine } from '../../data/bikes';
import type { Team } from '../../data/types';
import { ClassPurchaseBox } from './ClassPurchaseBox';

interface Props {
  engine: Engine;
  team: Team;
  budgetRemaining: number;
  purchases: Record<string, { quantity: number; selected: boolean }>;
  onUpdatePurchases: (purchases: Record<string, { quantity: number; selected: boolean }>) => void;
  onBack: () => void;
}

type ClassType = '350-pro' | '250' | '250p' | 'womens-250';

const CLASSES: ClassType[] = ['350-pro', '250', '250p', 'womens-250'];
const CLASS_NAMES = {
  '350-pro': '350 Pro Class',
  '250': '250 Men Class',
  '250p': '250P Restricted',
  'womens-250': "Women's 250",
};

export function EngineDetailView({
  engine,
  team,
  budgetRemaining,
  purchases,
  onUpdatePurchases,
  onBack,
}: Props) {
  const handlePurchaseUpdate = (classType: ClassType, quantity: number, selected: boolean) => {
    const key = `${engine.id}-${classType}`;
    onUpdatePurchases({
      ...purchases,
      [key]: { quantity, selected },
    });
  };

  return (
    <div class="detail-view">
      {/* Back Button */}
      <button class="btn-back" onClick={onBack}>← Back to Showroom</button>

      <div class="detail-content">
        {/* Left: Engine Visualization */}
        <div class="detail-left">
          <div class="engine-image">
            <div class="engine-icon-large">⚙️</div>
            <h2>{engine.name}</h2>
            <p class="manufacturer">{engine.manufacturer}</p>
          </div>

          {/* OVR Bonuses */}
          <div class="ovr-bonuses">
            <h4>OVR Bonuses</h4>
            {engine.ovrBonus && Object.entries(engine.ovrBonus).length > 0 ? (
              <div class="bonus-list">
                {Object.entries(engine.ovrBonus).map(([pillar, bonus]) => (
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
        </div>

        {/* Center: Stats Panel */}
        <div class="detail-center">
          <div class="stats-panel">
            <h3>Engine Specifications</h3>

            <div class="stat-item">
              <span class="stat-label">Horsepower:</span>
              <span class="stat-value">{engine.horsepower} HP</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Weight:</span>
              <span class="stat-value">{engine.weight} lbs</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Annual Lease Cost:</span>
              <span class="stat-value">${engine.yearlyLeaseCost.toLocaleString()}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Weekly Cost:</span>
              <span class="stat-value">${Math.round(engine.yearlyLeaseCost / 52).toLocaleString()}</span>
            </div>

            <hr />

            <div class="stat-item">
              <span class="stat-label">Description:</span>
              <p class="description">{engine.description || 'Premium engine specs'}</p>
            </div>
          </div>
        </div>

        {/* Right: Purchase Boxes + Budget */}
        <div class="detail-right">
          <div class="purchase-section">
            <h3>Select Classes to Purchase</h3>

            {CLASSES.map(classType => (
              <ClassPurchaseBox
                key={classType}
                classType={classType}
                className={CLASS_NAMES[classType]}
                leasePrice={classType === '250p' || classType === 'womens-250'
                  ? Math.round(engine.yearlyLeaseCost * 0.9)
                  : engine.yearlyLeaseCost}
                engineId={engine.id}
                selected={purchases[`${engine.id}-${classType}`]?.selected ?? false}
                quantity={purchases[`${engine.id}-${classType}`]?.quantity ?? 1}
                onUpdate={(quantity, selected) => handlePurchaseUpdate(classType, quantity, selected)}
              />
            ))}
          </div>

          {/* Budget Tracker */}
          <div class="budget-tracker">
            <h4>Budget Status</h4>
            <div class="budget-row">
              <span>Team Budget:</span>
              <span>${team.budget.toLocaleString()}</span>
            </div>
            <div class="budget-row total">
              <span>Remaining:</span>
              <span class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>
                ${budgetRemaining.toLocaleString()}
              </span>
            </div>
            {budgetRemaining < 0 && (
              <div class="budget-warning">⚠️ Over budget by ${Math.abs(budgetRemaining).toLocaleString()}</div>
            )}
            <button class="btn-confirm" disabled={budgetRemaining < 0}>
              ✓ Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
