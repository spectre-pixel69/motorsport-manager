// Chassis Showroom - Browse and purchase chassis for different classes

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import type { Chassis } from '../../data/bikes';
import { CHASSIS } from '../../data/bikes';
import { ShowroomGrid } from './ShowroomGrid';
import { ChassisDetailView } from './ChassisDetailView';
import './showroom.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

export function ChassisShowroom({ state, onExit }: Props) {
  const [selectedChassis, setSelectedChassis] = useState<Chassis | null>(null);
  const [purchases, setPurchases] = useState<Record<string, { quantity: number; selected: boolean }>>({});

  const chassis = Object.values(CHASSIS);
  const team = state.universe.teams[state.playerTeamId];

  const calculateTotalCost = (): number => {
    return chassis.reduce((sum, c) => {
      const key = c.id;
      const purchase = purchases[key];
      if (!purchase || !purchase.selected) return sum;

      const leasePerBike = c.yearlyLeaseCost / 52;
      return sum + (leasePerBike * purchase.quantity * 52);
    }, 0);
  };

  const budgetRemaining = team.budget - calculateTotalCost();

  return (
    <div class="showroom-container">
      <div class="showroom-header">
        <h1>🏗️ Chassis Showroom</h1>
        <div class="showroom-info">
          <span class="budget-display">
            Budget Remaining: <strong class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>
              ${budgetRemaining.toLocaleString()}
            </strong>
          </span>
          <button class="btn-close" onClick={onExit}>← Back</button>
        </div>
      </div>

      {!selectedChassis ? (
        <ShowroomGrid
          items={chassis}
          itemType="chassis"
          onSelectItem={setSelectedChassis}
        />
      ) : (
        <ChassisDetailView
          chassis={selectedChassis}
          team={team}
          budgetRemaining={budgetRemaining}
          purchases={purchases}
          onUpdatePurchases={setPurchases}
          onBack={() => setSelectedChassis(null)}
        />
      )}
    </div>
  );
}
