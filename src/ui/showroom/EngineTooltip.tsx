// Engine Tooltip - Hover preview with specs and class prices

import type { Engine } from '../../data/bikes';

interface Props {
  engine: Engine;
  position: { x: number; y: number };
}

export function EngineTooltip({ engine, position }: Props) {
  return (
    <div class="tooltip" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
      <div class="tooltip-header">
        <strong>{engine.name}</strong>
        <span class="tooltip-manufacturer">{engine.manufacturer}</span>
      </div>

      <div class="tooltip-specs">
        <div class="spec-row">
          <span class="label">Horsepower:</span>
          <span class="value">{engine.horsepower} HP</span>
        </div>
        <div class="spec-row">
          <span class="label">Weight:</span>
          <span class="value">{engine.weight} lbs</span>
        </div>
        <div class="spec-row">
          <span class="label">Annual Lease:</span>
          <span class="value">${engine.yearlyLeaseCost.toLocaleString()}</span>
        </div>
      </div>

      <div class="tooltip-prices">
        <h4>Class-Specific Lease Costs</h4>
        <div class="price-row">
          <span>350 Pro:</span>
          <span class="price">${(engine.yearlyLeaseCost).toLocaleString()}</span>
        </div>
        <div class="price-row">
          <span>250:</span>
          <span class="price">${(engine.yearlyLeaseCost).toLocaleString()}</span>
        </div>
        <div class="price-row">
          <span>250P (Restricted):</span>
          <span class="price">${Math.round(engine.yearlyLeaseCost * 0.9).toLocaleString()}</span>
        </div>
        <div class="price-row">
          <span>Women's 250:</span>
          <span class="price">${Math.round(engine.yearlyLeaseCost * 0.9).toLocaleString()}</span>
        </div>
      </div>

      <div class="tooltip-footer">
        ✓ Click to view details
      </div>
    </div>
  );
}
