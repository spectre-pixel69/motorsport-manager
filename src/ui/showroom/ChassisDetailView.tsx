// Chassis Detail View - Similar to Engine Detail

import type { Chassis } from '../../data/bikes';
import type { Team } from '../../data/types';
import { ClassPurchaseBox } from './ClassPurchaseBox';

interface Props {
  chassis: Chassis;
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

export function ChassisDetailView({
  chassis,
  team,
  budgetRemaining,
  purchases,
  onUpdatePurchases,
  onBack,
}: Props) {
  const handlePurchaseUpdate = (classType: ClassType, quantity: number, selected: boolean) => {
    const key = `${chassis.id}-${classType}`;
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
            <div class="item-icon-large">🏗️</div>
            <h2>{chassis.name}</h2>
            <p class="manufacturer">{chassis.manufacturer}</p>
          </div>

          <div class="ovr-bonuses">
            <h4>OVR Bonuses</h4>
            {chassis.ovrBonus && Object.entries(chassis.ovrBonus).length > 0 ? (
              <div class="bonus-list">
                {Object.entries(chassis.ovrBonus).map(([pillar, bonus]) => (
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
            <h3>Chassis Specifications</h3>

            <div class="stat-item">
              <span class="stat-label">Weight:</span>
              <span class="stat-value">{chassis.weight} lbs</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Rigidity:</span>
              <span class="stat-value">{chassis.rigidity}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Annual Lease Cost:</span>
              <span class="stat-value">${chassis.yearlyLeaseCost.toLocaleString()}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Weekly Cost:</span>
              <span class="stat-value">${Math.round(chassis.yearlyLeaseCost / 52).toLocaleString()}</span>
            </div>

            <hr />

            <div class="stat-item">
              <span class="stat-label">Description:</span>
              <p class="description">{chassis.description || 'Premium chassis design'}</p>
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
                leasePrice={classType === '250p' || classType === 'womens-250'
                  ? Math.round(chassis.yearlyLeaseCost * 0.9)
                  : chassis.yearlyLeaseCost}
                itemId={chassis.id}
                selected={purchases[`${chassis.id}-${classType}`]?.selected ?? false}
                quantity={purchases[`${chassis.id}-${classType}`]?.quantity ?? 1}
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
