// Track Days: Technical bike & setup analysis from Crewman 37/Dustin
// Commentary on engine tuning, parts, reliability, and performance

import { mulberry32 } from '../util/rng';
import type { Universe, TrackDaysEvent } from '../data/types';
import { ridersOfTeam } from '../data/universe';

export function generateTrackDaysForRound(
  u: Universe,
  rng: ReturnType<typeof mulberry32>,
  round: number,
  teamId: string
): TrackDaysEvent[] {
  const team = u.teams[teamId];
  if (!team) return [];

  const riders = ridersOfTeam(u, teamId);
  const events: TrackDaysEvent[] = [];

  // 40% chance of engine optimization commentary
  if (rng() < 0.40) {
    const commentary = dustinEngineOptimization(team, rng);
    if (commentary) {
      events.push({
        id: `trackdays-${round}-${teamId}-engine-${Date.now()}`,
        round,
        type: 'engine-optimization',
        teamId,
        headline: commentary.headline,
        body: commentary.body,
        technicalData: {
          performanceGain: commentary.gainMs,
          reliabilityScore: team.bike.reliability,
          setupAdjustments: commentary.adjustments,
        },
      });
    }
  }

  // 30% chance of setup breakthrough
  if (rng() < 0.30) {
    const commentary = dustinSetupBreakthrough(team, rng);
    if (commentary) {
      events.push({
        id: `trackdays-${round}-${teamId}-setup-${Date.now()}`,
        round,
        type: 'setup-breakthrough',
        teamId,
        headline: commentary.headline,
        body: commentary.body,
        technicalData: {
          performanceGain: commentary.gainMs,
          setupAdjustments: commentary.adjustments,
        },
      });
    }
  }

  // 25% chance of parts/reliability analysis
  if (rng() < 0.25) {
    const rider = riders[Math.floor(rng() * riders.length)];
    if (rider) {
      const commentary = dustinReliabilityAnalysis(team, rider, rng);
      if (commentary) {
        events.push({
          id: `trackdays-${round}-${teamId}-parts-${Date.now()}`,
          round,
          type: commentary.type as any,
          teamId,
          riderId: rider.id,
          componentType: commentary.component,
          headline: commentary.headline,
          body: commentary.body,
          technicalData: {
            reliabilityScore: team.bike.reliability,
            estimatedMileage: team.bikeSetup.mileageThisRound,
          },
        });
      }
    }
  }

  // 20% chance of tire strategy analysis
  if (rng() < 0.20) {
    const commentary = dustinTireStrategy(team, rng);
    if (commentary) {
      events.push({
        id: `trackdays-${round}-${teamId}-tires-${Date.now()}`,
        round,
        type: 'tire-strategy',
        teamId,
        headline: commentary.headline,
        body: commentary.body,
        technicalData: {
          setupAdjustments: commentary.notes,
        },
      });
    }
  }

  // 15% chance of performance delta vs field
  if (rng() < 0.15) {
    const commentary = dustinPerformanceDelta(team, u.teams, rng);
    if (commentary) {
      events.push({
        id: `trackdays-${round}-${teamId}-perf-${Date.now()}`,
        round,
        type: 'performance-delta',
        teamId,
        headline: commentary.headline,
        body: commentary.body,
        technicalData: {
          performanceGain: commentary.deltaMs,
        },
      });
    }
  }

  return events;
}

// ============================================================================
// DUSTIN'S COMMENTARY GENERATORS
// ============================================================================

function dustinEngineOptimization(team: any, rng: ReturnType<typeof mulberry32>) {
  const modes = ['conserve', 'standard', 'push', 'attack'];
  const adjustments = [
    'fuel mapping optimized for lean burn',
    'ignition timing advanced +2 degrees',
    'valve overlap widened for peak revs',
    'turbo boost pressure refined',
    'EFI calibration smoothed for consistency',
    'compression ratio tuned per fuel batch',
  ];

  const gainRange = [5, 15]; // milliseconds per lap
  const gain = gainRange[0] + rng() * (gainRange[1] - gainRange[0]);

  const templates = [
    `Engine shop's been busy. They've dialed in the fuel mapping on our ${modes[Math.floor(rng() * modes.length)]} mode. Should pick up about ${gain.toFixed(1)}ms per lap—small, but consistent. Reliability holding steady.`,
    `Technical director finally got the ignition timing right. We're seeing cleaner power delivery across the rev range. ${gain.toFixed(1)}ms better in the midrange where we were losing it.`,
    `Valve timing's been bothering me all season. They made an adjustment yesterday—should help us hold edge through Turn 3. Early numbers suggest ${gain.toFixed(1)}ms in that zone.`,
  ];

  return {
    headline: `Engine tuning: +${gain.toFixed(1)}ms per lap`,
    body: templates[Math.floor(rng() * templates.length)],
    adjustments: [adjustments[Math.floor(rng() * adjustments.length)]],
    gainMs: gain,
  };
}

function dustinSetupBreakthrough(team: any, rng: ReturnType<typeof mulberry32>) {
  const adjustments = [
    'suspension compressed 2mm front, 1.5mm rear',
    'swingarm geometry angle reduced 0.3 degrees',
    'weight distribution shifted rear 2 inches',
    'brake bite point lowered for modulation',
    'steering head angle increased 0.2 degrees',
    'chassis flex tuned for corner exit grip',
  ];

  const gainRange = [8, 25];
  const gain = gainRange[0] + rng() * (gainRange[1] - gainRange[0]);

  const templates = [
    `We've been playing with suspension geometry, and it finally clicked. Got the setup balanced—bike sits better mid-corner. That's worth ${gain.toFixed(1)}ms to us, especially in series of corners.`,
    `Chassis guy made a breakthrough with the swingarm angle. Whole bike feels planted now. We're seeing consistent gains of ${gain.toFixed(1)}ms lap-to-lap. Even the riders are smiling about it.`,
    `Weight transfer was the culprit. Moved things around in the chassis, and now the bike rotates like it should. Early data shows ${gain.toFixed(1)}ms improvement. Could be even better after break-in.`,
  ];

  return {
    headline: `Setup breakthrough: +${gain.toFixed(1)}ms lap time`,
    body: templates[Math.floor(rng() * templates.length)],
    adjustments: [adjustments[Math.floor(rng() * adjustments.length)]],
    gainMs: gain,
  };
}

function dustinReliabilityAnalysis(team: any, rider: any, rng: ReturnType<typeof mulberry32>) {
  const components = ['engine', 'chassis', 'suspension', 'brakes', 'electronics'];
  const comp = components[Math.floor(rng() * components.length)];

  if (rng() < 0.6) {
    // Parts upgrade needed
    const templates = [
      `${rider.name}'s been pushing hard. ${comp} is showing wear. We're planning a rebuild this week—should bring us back to baseline reliability.`,
      `Mileage adding up on the ${comp}. Nothing critical yet, but I want to get ahead of it. Rebuild scheduled before next round.`,
      `That DNF last week cost us. ${comp} component is stressed. Parts are on order—should arrive before practice.`,
    ];

    return {
      type: 'reliability-concern',
      component: comp,
      headline: `${comp.charAt(0).toUpperCase() + comp.slice(1)} rebuild planned`,
      body: templates[Math.floor(rng() * templates.length)],
    };
  } else {
    // Parts holding up well
    const templates = [
      `Good news on ${rider.name}'s ${comp}. Reliability holding strong despite the heat. We're on schedule for a full season.`,
      `That new ${comp} supplier is working out. No issues so far. We'll monitor closely, but it's looking solid.`,
      `${rider.name}'s ${comp} is running clean. Parts quality has been dependable all season. Knock on wood, we'll make it to the final round without drama.`,
    ];

    return {
      type: 'parts-upgrade',
      component: comp,
      headline: `${comp.charAt(0).toUpperCase() + comp.slice(1)} performing on schedule`,
      body: templates[Math.floor(rng() * templates.length)],
    };
  }
}

function dustinTireStrategy(team: any, rng: ReturnType<typeof mulberry32>) {
  const strategies = [
    'save the soft compound for the second half of the race',
    'start on medium, pit for the hard if attrition plays out',
    'go hard compound for tire life, manage pace early',
    'dual-compound strategy depending on track temps',
    'preserve tire grip through Turn 1 restart zones',
  ];

  const notes = [strategies[Math.floor(rng() * strategies.length)]];

  const templates = [
    `Tire game is critical this round. Thinking we ${notes[0]}. Temps are going to climb, and we need the rubber fresh for the push.`,
    `We've studied the data from last time here. My call: ${notes[0]}. Risky, but it suits our bike setup.`,
    `Tire degradation looked brutal on last year's footage. This year we're being smarter: ${notes[0]}.`,
  ];

  return {
    headline: 'Tire strategy for the round',
    body: templates[Math.floor(rng() * templates.length)],
    notes,
  };
}

function dustinPerformanceDelta(team: any, allTeams: Record<string, any>, rng: ReturnType<typeof mulberry32>) {
  const competitors = Object.values(allTeams)
    .filter((t: any) => t.id !== team.id && t.discipline === team.discipline)
    .slice(0, 3);

  const deltaRange = [-12, 15];
  const delta = deltaRange[0] + rng() * (deltaRange[1] - deltaRange[0]);

  const sign = delta > 0 ? 'up' : 'down';
  const templates = [
    `Compared to the field, we're running ${Math.abs(delta).toFixed(1)}ms ${sign} on pace. Not where we want to be, but the trend is positive.`,
    `Numbers came back from our data team. We're ${delta > 0 ? 'competitive' : 'chasing'} the leaders by about ${Math.abs(delta).toFixed(1)}ms. Work to do.`,
    `Pace delta analysis: ${delta > 0 ? 'we\'re gaining on the field' : 'we\'re slipping back'}. ${Math.abs(delta).toFixed(1)}ms separates us right now.`,
  ];

  return {
    headline: `Pace vs field: ${delta > 0 ? '+' : ''}${delta.toFixed(1)}ms`,
    body: templates[Math.floor(rng() * templates.length)],
    deltaMs: delta,
  };
}
