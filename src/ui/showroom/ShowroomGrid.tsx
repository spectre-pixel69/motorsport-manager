// Generic Showroom Grid - Reusable for engines, chassis, etc

import { useState } from 'preact/hooks';
import type { Engine, Chassis, Tire } from '../../data/bikes';
import type { ExhaustSystem } from '../../data/setups';
import { ShowroomTooltip } from './ShowroomTooltip';

type Item = Engine | Chassis | Tire | ExhaustSystem | { id: string; name: string };

interface Props {
  items: Item[];
  itemType: 'engine' | 'chassis' | 'tire' | 'electronic' | 'exhaust';
  onSelectItem: (item: Item) => void;
}

export function ShowroomGrid({ items, itemType, onSelectItem }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseEnter = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.right + 10, y: rect.top });
  };

  const getLabel = (item: Item): string => {
    if ('horsepower' in item) return `${item.horsepower} HP • ${item.weight}lbs`;
    if ('rigidity' in item) return `${item.weight}lbs • Rigidity ${item.rigidity}`;
    return '';
  };

  return (
    <div class="showroom-grid">
      {items.map(item => (
        <div
          key={item.id}
          class="showroom-thumbnail"
          onMouseEnter={(e) => {
            setHoveredId(item.id);
            handleMouseEnter(e as any);
          }}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onSelectItem(item)}
        >
          <div class="thumbnail-image">
            <div class="item-icon">
              {itemType === 'engine' ? '⚙️' : itemType === 'chassis' ? '🏗️' : '🔧'}
            </div>
            <div class="item-name">{item.name}</div>
          </div>

          <div class="thumbnail-label">
            {getLabel(item)}
          </div>

          {hoveredId === item.id && (
            <ShowroomTooltip
              item={item}
              itemType={itemType}
              position={tooltipPos}
            />
          )}
        </div>
      ))}
    </div>
  );
}
