// Engine Showroom - Browse, compare, and purchase engines
// Hover → Tooltip Preview → Click Zoom → Multi-class Purchase

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import type { Engine } from '../../data/bikes';
import { ENGINES } from '../../data/bikes';
import { EngineGrid } from './EngineGrid';
import { EngineDetailView } from './EngineDetailView';
import './showroom.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

export function EngineShowroom({ state, onExit }: Props) {
  const [selectedEngine, setSelectedEngine] = useState<Engine | null>(null);
  const [purchases, setPurchases] = useState<Record<string, { quantity: number; selected: boolean }>>({});

  const engines = Object.values(ENGINES);
  const team = state.universe.teams[state.playerTeamId];

  const calculateTotalCost = (): number => {
    return engines.reduce((sum, engine) => {
      const key = engine.id;
      const purchase = purchases[key];
      if (!purchase || !purchase.selected) return sum;

      const leasePerBike = engine.yearlyLeaseCost / 52; // Weekly cost
      return sum + (leasePerBike * purchase.quantity * 52); // Annualized
    }, 0);
  };

  const budgetRemaining = team.budget - calculateTotalCost();

  return (
    <div class="showroom-container">
      <div class="showroom-header">
        <h1>🏪 Engine Showroom</h1>
        <div class="showroom-info">
          <span class="budget-display">
            Budget Remaining: <strong class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>
              ${budgetRemaining.toLocaleString()}
            </strong>
          </span>
          <button class="btn-close" onClick={onExit}>← Back</button>
        </div>
      </div>

      {!selectedEngine ? (
        // Showroom Grid View
        <EngineGrid
          engines={engines}
          team={team}
          onSelectEngine={setSelectedEngine}
        />
      ) : (
        // Detailed View with Purchase Options
        <EngineDetailView
          engine={selectedEngine}
          team={team}
          budgetRemaining={budgetRemaining}
          purchases={purchases}
          onUpdatePurchases={setPurchases}
          onBack={() => setSelectedEngine(null)}
        />
      )}
    </div>
  );
}
