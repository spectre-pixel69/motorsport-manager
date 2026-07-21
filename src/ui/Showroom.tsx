// Showroom hub — one entry point for all part categories. Pick a category,
// browse the grid, click a part to zoom into its full-screen detail view
// (each category screen owns its zoom + back behavior).

import { useState } from 'preact/hooks';
import type { CareerState } from '../game/state';
import { EngineShowroom } from './showroom/EngineShowroom';
import { ChassisShowroom } from './showroom/ChassisShowroom';
import { TiresShowroom } from './showroom/TiresShowroom';
import { SuspensionShowroom } from './showroom/SuspensionShowroom';
import { ElectronicsShowroom } from './showroom/ElectronicsShowroom';
import { ExhaustShowroom } from './showroom/ExhaustShowroom';
import { StaffShowroom } from './showroom/StaffShowroom';
import './showroom/showroom.css';

type Category = null | 'engines' | 'chassis' | 'tires' | 'suspension' | 'electronics' | 'exhaust' | 'staff';

const CATEGORIES: { id: Exclude<Category, null>; icon: string; name: string; blurb: string }[] = [
  { id: 'engines', icon: '⚙️', name: 'Engines', blurb: 'Power plants per class — lease or buy' },
  { id: 'chassis', icon: '🏍️', name: 'Chassis', blurb: 'Frames: stability vs agility' },
  { id: 'tires', icon: '🛞', name: 'Tires', blurb: 'Open tire war — every brand competes' },
  { id: 'suspension', icon: '🔩', name: 'Suspension', blurb: 'Forks & shocks for rough dirt' },
  { id: 'electronics', icon: '💻', name: 'Electronics', blurb: 'ECU packages (250P: spec ECU only)' },
  { id: 'exhaust', icon: '🔥', name: 'Exhaust', blurb: 'Systems: power curve shaping' },
  { id: 'staff', icon: '🧑‍🔧', name: 'Staff', blurb: 'Coaches, mechanics, engineers' },
];

export function Showroom({ state, onExit }: { state: CareerState; onExit: () => void }) {
  const [cat, setCat] = useState<Category>(null);
  const back = () => setCat(null);

  if (cat === 'engines') return <EngineShowroom state={state} onExit={back} />;
  if (cat === 'chassis') return <ChassisShowroom state={state} onExit={back} />;
  if (cat === 'tires') return <TiresShowroom state={state} onExit={back} />;
  if (cat === 'suspension') return <SuspensionShowroom state={state} onExit={back} />;
  if (cat === 'electronics') return <ElectronicsShowroom state={state} onExit={back} />;
  if (cat === 'exhaust') return <ExhaustShowroom state={state} onExit={back} />;
  if (cat === 'staff') return <StaffShowroom state={state} onExit={back} />;

  const team = state.universe.teams[state.playerTeamId];
  return (
    <div class="screen">
      <div class="row mb" style="justify-content:space-between;align-items:center">
        <h2>🏪 Showroom</h2>
        <div class="row" style="gap:12px;align-items:center">
          <span class="muted">Budget: ${(team.budget / 1000).toFixed(0)}k</span>
          <button class="ghost" onClick={onExit}>← Back to HQ</button>
        </div>
      </div>
      <div class="panel scroll" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;padding:16px">
        {CATEGORIES.map(c => (
          <button key={c.id} class="panel" style="cursor:pointer;text-align:left;padding:18px;border:1px solid #1a1f3a" onClick={() => setCat(c.id)}>
            <div style="font-size:28px">{c.icon}</div>
            <div style="font-weight:700;margin:6px 0 2px">{c.name}</div>
            <div class="muted" style="font-size:12px">{c.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
