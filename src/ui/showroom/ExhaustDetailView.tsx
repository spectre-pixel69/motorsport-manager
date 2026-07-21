// Exhaust Detail View - Per-class purchase options for exhaust systems

import type { ExhaustSystem } from '../../data/setups';
import type { Team } from '../../data/types';
import { ClassPurchaseBox } from './ClassPurchaseBox';

interface Props {
  exhaust: ExhaustSystem;
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

export function ExhaustDetailView({
  exhaust,
  team,
  budgetRemaining,
  purchases,
  onUpdatePurchases,
  onBack,
}: Props) {
  const handlePurchaseUpdate = (classType: ClassType, quantity: number, selected: boolean) => {
    const key = `${exhaust.id}-${classType}`;
    onUpdatePurchases({
      ...purchases,
      [key]: { quantity, selected },
    });
  };

  return (
    <div class="detail-view">
      <button class="btn-back" onClick={onBack}>← Back to Showroom</button>

      <div class="detail-content">
        <div class="detail-left">
          <div class="item-image">
            <div class="item-icon-large">💨</div>
            <h2>{exhaust.name}</h2>
            <p class="description-short">{exhaust.description}</p>
          </div>

          <div class="ovr-bonuses">
            <h4>OVR Bonuses</h4>
            {exhaust.ovrBonus && Object.entries(exhaust.ovrBonus).length > 0 ? (
              <div class="bonus-list">
                {Object.entries(exhaust.ovrBonus).map(([pillar, bonus]) => (
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

        <div class="detail-center">
          <div class="stats-panel">
            <h3>Exhaust Specifications</h3>

            <div class="stat-item">
              <span class="stat-label">Torque Character:</span>
              <span class="stat-value">{exhaust.torqueCharacter}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Cost Per Bike:</span>
              <span class="stat-value">${exhaust.costPerBike.toLocaleString()}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Yearly Cost (2 bikes):</span>
              <span class="stat-value">${(exhaust.costPerBike * 2).toLocaleString()}</span>
            </div>

            <hr />

            <div class="stat-item">
              <span class="stat-label">Description:</span>
              <p class="description">{exhaust.description || 'Premium exhaust system'}</p>
            </div>
          </div>
        </div>

        <div class="detail-right">
          <div class="purchase-section">
            <h3>Select Classes to Purchase</h3>

            {CLASSES.map(classType => (
              <ClassPurchaseBox
                key={classType}
                classType={classType}
                className={CLASS_NAMES[classType]}
                leasePrice={exhaust.costPerBike}
                itemId={exhaust.id}
                selected={purchases[`${exhaust.id}-${classType}`]?.selected ?? false}
                quantity={purchases[`${exhaust.id}-${classType}`]?.quantity ?? 1}
                onUpdate={(quantity, selected) => handlePurchaseUpdate(classType, quantity, selected)}
              />
            ))}
          </div>

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
