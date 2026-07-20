// R&D Center — Bike development investment and technology unlock
// Three philosophy paths: Complexity (handling), Power (engine), Adaptability (reliability)

import { useState } from 'preact/hooks';
import type { CareerState } from '../game/state';
import { saveCareer } from '../game/state';

interface Props {
  state: CareerState;
  onExit: () => void;
}

type Philosophy = 'complexity' | 'power' | 'adaptability';

const PHILOSOPHIES: Record<Philosophy, { name: string; stat: keyof any; emoji: string; description: string }> = {
  complexity: {
    name: 'Complexity (Handling)',
    stat: 'handling',
    emoji: '🎯',
    description: 'Invest in suspension geometry, weight distribution, and chassis tuning for superior mid-corner speed and handling response.',
  },
  power: {
    name: 'Power (Engine)',
    stat: 'engine',
    emoji: '⚡',
    description: 'Develop engine mapping, fuel injection timing, and combustion chamber design for more usable horsepower.',
  },
  adaptability: {
    name: 'Adaptability (Reliability)',
    stat: 'reliability',
    emoji: '🛡️',
    description: 'Engineer robust components, stress-tested durability, and redundancy systems to reduce mechanical failures.',
  },
};

const UPGRADE_COST = 50_000;
const UPGRADE_GAIN = 2;  // 2 points per upgrade (on a 1-100 scale)

export function RDCenter({ state, onExit }: Props) {
  const u = state.universe;
  const team = u.teams[state.playerTeamId];
  const [selectedPhil, setSelectedPhil] = useState<Philosophy>('complexity');

  const philo = PHILOSOPHIES[selectedPhil];
  const currentLevel = team.bike[philo.stat as keyof typeof team.bike] as number;
  const canAfford = team.budget >= UPGRADE_COST;
  const isMaxed = currentLevel >= 100;

  const handleUpgrade = () => {
    if (!canAfford || isMaxed) return;
    team.budget -= UPGRADE_COST;
    (team.bike[philo.stat as keyof typeof team.bike] as any) = Math.min(
      100,
      currentLevel + UPGRADE_GAIN,
    );
    // Adaptability = reliability: the race sim reads per-component reliability
    // (bikeSetup.components), not the flat team.bike.reliability. Bump the
    // components too, or the investment does nothing in the race.
    if (selectedPhil === 'adaptability' && team.bikeSetup?.components) {
      for (const key of Object.keys(team.bikeSetup.components)) {
        const c = team.bikeSetup.components[key];
        c.reliability = Math.min(98, c.reliability + UPGRADE_GAIN);
      }
    }
    state.messages.unshift(`🔧 R&D: ${team.name} invested in ${philo.name.toLowerCase()}. Level now ${currentLevel + UPGRADE_GAIN}/100.`);
    saveCareer(state);
  };

  const remainingToMax = Math.ceil((100 - currentLevel) / UPGRADE_GAIN);
  const costToMax = remainingToMax * UPGRADE_COST;

  return (
    <div class="screen">
      <div class="row mb" style="justify-content:space-between;align-items:center">
        <h1>🧪 R&D Center</h1>
        <button class="ghost" onClick={onExit}>← Back</button>
      </div>

      <div class="panel scroll">
        <p class="muted">
          Choose a development philosophy for your bike. Each upgrade costs ${UPGRADE_COST.toLocaleString()} and increases the chosen attribute by {UPGRADE_GAIN} points (max 100).
        </p>

        {/* Philosophy Selection */}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-bottom:20px">
          {(Object.keys(PHILOSOPHIES) as Philosophy[]).map(p => (
            <div
              key={p}
              class="panel"
              onClick={() => setSelectedPhil(p)}
              style={`cursor:pointer;border:2px solid ${p === selectedPhil ? '#2ecc71' : '#1a1f3a'};padding:16px;transition:all 0.2s`}
            >
              <div style="font-size:32px;margin-bottom:8px">{PHILOSOPHIES[p].emoji}</div>
              <div style="font-weight:bold;margin-bottom:4px">{PHILOSOPHIES[p].name}</div>
              <div class="muted" style="font-size:12px">{PHILOSOPHIES[p].description}</div>
              <div style="margin-top:12px;font-size:18px;color:#2ecc71">
                Level {Math.round(team.bike[PHILOSOPHIES[p].stat as keyof typeof team.bike] as number)}/100
              </div>
            </div>
          ))}
        </div>

        {/* Development Detail */}
        <div class="panel" style="padding:20px;background:linear-gradient(135deg, #15192e 0%, #1a1f3a 100%)">
          <h3>{philo.emoji} {philo.name}</h3>
          <p class="muted" style="margin-bottom:16px">{philo.description}</p>

          {/* Progress Bar */}
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span class="muted">Development Level</span>
              <span style="font-weight:bold">{Math.round(currentLevel)}/100</span>
            </div>
            <div style="height:24px;background:#0a0e27;border-radius:4px;overflow:hidden">
              <div
                style={{
                  width: `${currentLevel}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Upgrade Info */}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div class="panel" style="padding:12px;background:#0a0e27">
              <div class="muted" style="font-size:11px">Cost per upgrade</div>
              <div style="font-size:18px;font-weight:bold">${UPGRADE_COST.toLocaleString()}</div>
            </div>
            <div class="panel" style="padding:12px;background:#0a0e27">
              <div class="muted" style="font-size:11px">Gain per upgrade</div>
              <div style="font-size:18px;font-weight:bold">+{UPGRADE_GAIN} pts</div>
            </div>
            <div class="panel" style="padding:12px;background:#0a0e27">
              <div class="muted" style="font-size:11px">Upgrades to max</div>
              <div style="font-size:18px;font-weight:bold">{remainingToMax}</div>
            </div>
            <div class="panel" style="padding:12px;background:#0a0e27">
              <div class="muted" style="font-size:11px">Total cost to max</div>
              <div style="font-size:18px;font-weight:bold">${Math.round(costToMax).toLocaleString()}</div>
            </div>
          </div>

          {/* Budget Status */}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <span class="muted">Your budget</span>
            <span style={`font-weight:bold;color:${canAfford ? '#2ecc71' : '#e74c3c'}`}>
              ${Math.round(team.budget).toLocaleString()}
            </span>
          </div>

          {/* Action Button */}
          <button
            class="btn-primary"
            onClick={handleUpgrade}
            disabled={!canAfford || isMaxed}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              cursor: canAfford && !isMaxed ? 'pointer' : 'not-allowed',
              opacity: canAfford && !isMaxed ? 1 : 0.5,
            }}
          >
            {isMaxed ? `✓ Maxed out at Level 100` : canAfford ? `Invest $${UPGRADE_COST.toLocaleString()}` : `Insufficient budget`}
          </button>
        </div>

        {/* Game Mechanic Info */}
        <div class="panel" style="padding:16px;background:#0a0e27">
          <h4 style="margin-top:0">How R&D Affects Races</h4>
          <ul style="margin:8px 0;padding-left:20px;font-size:13px">
            <li><b>Handling (Complexity):</b> Higher handling improves mid-corner speed and consistency, especially on technical tracks.</li>
            <li><b>Engine (Power):</b> Higher engine development increases available power and top-end performance on fast tracks.</li>
            <li><b>Reliability (Adaptability):</b> Higher reliability reduces part failure rates and DNF risk across all conditions.</li>
          </ul>
          <p class="muted" style="font-size:12px;margin-top:12px">All three attributes affect race pace. Balanced development is stronger than specialization — jack-of-all-trades beats one-trick pony.</p>
        </div>
      </div>
    </div>
  );
}
