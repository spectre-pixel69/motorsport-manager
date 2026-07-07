// Tires Showroom - Select tire brand and compound per class

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import type { Tire } from '../../data/bikes';
import { TIRES } from '../../data/bikes';
import './showroom.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

type ClassType = '350-pro' | '250' | '250p' | 'womens-250';

const CLASSES: ClassType[] = ['350-pro', '250', '250p', 'womens-250'];

export function TiresShowroom({ state, onExit }: Props) {
  const [selections, setSelections] = useState<Record<ClassType, string>>({
    '350-pro': '',
    '250': '',
    '250p': '',
    'womens-250': '',
  });

  const team = state.universe.teams[state.playerTeamId];
  const tires = Object.values(TIRES);

  const handleSelectTire = (classType: ClassType, tireId: string) => {
    setSelections({ ...selections, [classType]: tireId });
  };

  return (
    <div class="showroom-container">
      <div class="showroom-header">
        <h1>🛞 Tires Showroom</h1>
        <button class="btn-close" onClick={onExit}>← Back</button>
      </div>

      <div class="tires-grid">
        {CLASSES.map(classType => (
          <div class="tire-class-section" key={classType}>
            <h3 class="class-title">
              {classType === '350-pro' ? '350 Pro' : classType === '250' ? '250 Men' : classType === '250p' ? '250P' : "Women's 250"}
            </h3>

            <div class="tire-options">
              {tires.map(tire => (
                <div
                  class={`tire-card ${selections[classType] === tire.id ? 'selected' : ''}`}
                  key={tire.id}
                  onClick={() => handleSelectTire(classType, tire.id)}
                >
                  <div class="tire-name">{tire.brand}</div>
                  <div class="tire-specs">
                    <div class="spec">Grip: {tire.grip}</div>
                    <div class="spec">Wear: {tire.wearRate}%</div>
                  </div>
                  {selections[classType] === tire.id && (
                    <div class="selected-badge">✓ Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div class="tires-footer">
        <button class="btn-confirm">✓ Confirm Tire Selections</button>
      </div>
    </div>
  );
}
