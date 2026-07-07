// Engine Grid - Thumbnail view with hover tooltips

import { useState } from 'preact/hooks';
import type { Engine } from '../../data/bikes';
import type { Team } from '../../data/types';
import { EngineTooltip } from './EngineTooltip';

interface Props {
  engines: Engine[];
  team: Team;
  onSelectEngine: (engine: Engine) => void;
}

export function EngineGrid({ engines, team, onSelectEngine }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseEnter = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.right + 10, y: rect.top });
  };

  return (
    <div class="showroom-grid">
      {engines.map(engine => (
        <div
          key={engine.id}
          class="engine-thumbnail"
          onMouseEnter={(e) => {
            setHoveredId(engine.id);
            handleMouseEnter(e as any);
          }}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onSelectEngine(engine)}
        >
          <div class="thumbnail-image">
            <div class="engine-icon">⚙️</div>
            <div class="engine-name">{engine.name}</div>
          </div>

          <div class="thumbnail-label">
            {engine.horsepower} HP • {engine.weight}lbs
          </div>

          {hoveredId === engine.id && (
            <EngineTooltip
              engine={engine}
              position={tooltipPos}
            />
          )}
        </div>
      ))}
    </div>
  );
}
