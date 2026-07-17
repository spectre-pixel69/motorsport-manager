// Tires Showroom - Select tire brand and compound per class

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import type { Tire } from '../../data/bikes';
import { TIRES } from '../../data/bikes';
import { TireDetailView } from './TireDetailView';
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
  const [detailTire, setDetailTire] = useState<Tire | null>(null);

  const team = state.universe.teams[state.playerTeamId];
  const tires = Object.values(TIRES);

  const handleSelectTire = (classType: ClassType, tireId: string) => {
    setSelections({ ...selections, [classType]: tireId });
  };

  if (detailTire) {
    const isSupplier = Object.values(selections).some(id => id === detailTire.id);
    return (
      <div class="showroom-container">
        <TireDetailView
          tire={detailTire}
          team={team}
          selected={isSupplier}
          onSelect={() => setSelections({
            '350-pro': detailTire.id,
            '250': detailTire.id,
            '250p': detailTire.id,
            'womens-250': detailTire.id,
          })}
          onBack={() => setDetailTire(null)}
        />
      </div>
    );
  }

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
                  <div class="tire-name">{tire.name}</div>
                  <div class="tire-specs">
                    <div class="spec">Grip: {tire.gripRating}</div>
                    <div class="spec">Wear Rate: {Math.round(tire.wearRate * 100)}%</div>
                  </div>
                  <button
                    class="detail-link"
                    onClick={(e: Event) => { e.stopPropagation(); setDetailTire(tire); }}
                  >Details →</button>
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
