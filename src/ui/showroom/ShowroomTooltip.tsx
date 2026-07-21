// Generic Showroom Tooltip - Reusable for different item types

import type { Engine, Chassis, Tire } from '../../data/bikes';
import type { ExhaustSystem } from '../../data/setups';

type Item = Engine | Chassis | Tire | ExhaustSystem | { id: string; name: string };

interface Props {
  item: Item;
  itemType: 'engine' | 'chassis' | 'tire' | 'electronic' | 'exhaust';
  position: { x: number; y: number };
}

export function ShowroomTooltip({ item, itemType, position }: Props) {
  const isEngine = 'horsepower' in item;
  const isChassis = 'rigidity' in item;
  const isExhaust = 'torqueCharacter' in item;
  const isTire = 'gripRating' in item;
  const hasLeaseCost = 'yearlyLeaseCost' in item;
  const hasManufacturer = 'manufacturer' in item;

  return (
    <div class="tooltip" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
      <div class="tooltip-header">
        <strong>{item.name}</strong>
        {hasManufacturer && <span class="tooltip-manufacturer">{(item as any).manufacturer}</span>}
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
        {isExhaust && (
          <>
            <div class="spec-row">
              <span class="label">Torque:</span>
              <span class="value">{(item as ExhaustSystem).torqueCharacter}</span>
            </div>
          </>
        )}
        {isTire && (
          <>
            <div class="spec-row">
              <span class="label">Grip:</span>
              <span class="value">{(item as Tire).gripRating}</span>
            </div>
          </>
        )}
        {hasLeaseCost && (
          <div class="spec-row">
            <span class="label">Annual Lease:</span>
            <span class="value">${(item as any).yearlyLeaseCost.toLocaleString()}</span>
          </div>
        )}
      </div>

      {hasLeaseCost && (
        <div class="tooltip-prices">
          <h4>Class-Specific Lease</h4>
          <div class="price-row">
            <span>350 Pro:</span>
            <span class="price">${(item as any).yearlyLeaseCost.toLocaleString()}</span>
          </div>
          <div class="price-row">
            <span>250:</span>
            <span class="price">${(item as any).yearlyLeaseCost.toLocaleString()}</span>
          </div>
          <div class="price-row">
            <span>250P:</span>
            <span class="price">${Math.round((item as any).yearlyLeaseCost * 0.9).toLocaleString()}</span>
          </div>
          <div class="price-row">
            <span>Women's 250:</span>
            <span class="price">${Math.round((item as any).yearlyLeaseCost * 0.9).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div class="tooltip-footer">
        ✓ Click to view details
      </div>
    </div>
  );
}
