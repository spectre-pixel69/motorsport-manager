// Generic Showroom Tooltip - Reusable for different item types

import type { Engine, Chassis } from '../../data/bikes';

type Item = Engine | Chassis;

interface Props {
  item: Item;
  itemType: 'engine' | 'chassis' | 'tire' | 'electronic' | 'exhaust';
  position: { x: number; y: number };
}

export function ShowroomTooltip({ item, itemType, position }: Props) {
  const isEngine = 'horsepower' in item;
  const isChassis = 'rigidity' in item;

  return (
    <div class="tooltip" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
      <div class="tooltip-header">
        <strong>{item.name}</strong>
        <span class="tooltip-manufacturer">{item.manufacturer}</span>
      </div>

      <div class="tooltip-specs">
        {isEngine && (
          <>
            <div class="spec-row">
              <span class="label">Horsepower:</span>
              <span class="value">{(item as Engine).horsepower} HP</span>
            </div>
            <div class="spec-row">
              <span class="label">Weight:</span>
              <span class="value">{(item as Engine).weight} lbs</span>
            </div>
          </>
        )}
        {isChassis && (
          <>
            <div class="spec-row">
              <span class="label">Weight:</span>
              <span class="value">{(item as Chassis).weight} lbs</span>
            </div>
            <div class="spec-row">
              <span class="label">Rigidity:</span>
              <span class="value">{(item as Chassis).rigidity}</span>
            </div>
          </>
        )}
        <div class="spec-row">
          <span class="label">Annual Lease:</span>
          <span class="value">${item.yearlyLeaseCost.toLocaleString()}</span>
        </div>
      </div>

      <div class="tooltip-prices">
        <h4>Class-Specific Lease</h4>
        <div class="price-row">
          <span>350 Pro:</span>
          <span class="price">${item.yearlyLeaseCost.toLocaleString()}</span>
        </div>
        <div class="price-row">
          <span>250:</span>
          <span class="price">${item.yearlyLeaseCost.toLocaleString()}</span>
        </div>
        <div class="price-row">
          <span>250P:</span>
          <span class="price">${Math.round(item.yearlyLeaseCost * 0.9).toLocaleString()}</span>
        </div>
        <div class="price-row">
          <span>Women's 250:</span>
          <span class="price">${Math.round(item.yearlyLeaseCost * 0.9).toLocaleString()}</span>
        </div>
      </div>

      <div class="tooltip-footer">
        ✓ Click to view details
      </div>
    </div>
  );
}
