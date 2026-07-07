// Exhaust Showroom - Exhaust systems with 4-class purchase options

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import type { ExhaustSystem } from '../../data/setups';
import { EXHAUST_SYSTEMS } from '../../data/setups';
import { ShowroomGrid } from './ShowroomGrid';
import { ExhaustDetailView } from './ExhaustDetailView';
import './showroom.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

export function ExhaustShowroom({ state, onExit }: Props) {
  const [selectedExhaust, setSelectedExhaust] = useState<ExhaustSystem | null>(null);
  const [purchases, setPurchases] = useState<Record<string, { quantity: number; selected: boolean }>>({});

  const exhausts = Object.values(EXHAUST_SYSTEMS);
  const team = state.universe.teams[state.playerTeamId];

  const calculateTotalCost = (): number => {
    return exhausts.reduce((sum, e) => {
      const key = e.id;
      const purchase = purchases[key];
      if (!purchase || !purchase.selected) return sum;

      const costPerBike = e.costPerBike;
      return sum + (costPerBike * purchase.quantity);
    }, 0);
  };

  const budgetRemaining = team.budget - calculateTotalCost();

  return (
    <div class="showroom-container">
      <div class="showroom-header">
        <h1>💨 Exhaust Showroom</h1>
        <div class="showroom-info">
          <span class="budget-display">
            Budget Remaining: <strong class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>
              ${budgetRemaining.toLocaleString()}
            </strong>
          </span>
          <button class="btn-close" onClick={onExit}>← Back</button>
        </div>
      </div>

      {!selectedExhaust ? (
        <ShowroomGrid
          items={exhausts}
          itemType="exhaust"
          onSelectItem={setSelectedExhaust}
        />
      ) : (
        <ExhaustDetailView
          exhaust={selectedExhaust}
          team={team}
          budgetRemaining={budgetRemaining}
          purchases={purchases}
          onUpdatePurchases={setPurchases}
          onBack={() => setSelectedExhaust(null)}
        />
      )}
    </div>
  );
}
