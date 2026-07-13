// Rider psychology — the layer that makes a digital rider feel alive.
//
// Design rules (locked with the boss):
//  1. INCREMENTAL, NEVER WHIPLASH. No single event moves any dial more than
//     ±3 points on a 0-100 scale. A rider's stats decide where he finishes;
//     the mental layer only nudges the edges.
//  2. Race-day pace effect is hard-capped at ±1%. To even reach the cap a
//     rider has to stack several events in the same direction.
//  3. EXPECTATION vs OUTCOME drives the reaction, not raw position.
//     The Hunter Lawrence rule: lead the moto, lay it down with nine turns
//     to go, get passed by your brother, finish P2 — and P2 is a LOSS.
//     Meanwhile a privateer who expected P25 and got P12 is over the moon.
//  4. Sustained mismanagement is what kills you. Increments compound across
//     a 20-round season into real storylines; one bad interview never
//     tanks a title run.

import type { Rider, RiderMentalState, Universe } from '../data/types';
import type { WeekendResult } from '../sim/weekend';
import { clamp } from '../util/rng';

// ------------------------------------------------------------- state

export function initialMentalState(): RiderMentalState {
  return {
    confidence: 50,
    tilt: 0,
    fatigue: 0,
    angerCharge: 0,
    consecutiveWins: 0,
    consecutivePodiums: 0,
    peakForm: false,
    lastEvents: [],
  };
}

/** Lazy init so pre-psychology saves keep loading. */
export function ensureMental(r: Rider): RiderMentalState {
  if (!r.mental) r.mental = initialMentalState();
  return r.mental;
}

// ------------------------------------------------------------- events

export type MentalEventType =
  | 'win'                       // took the main
  | 'podium'                    // top 3
  | 'peakFormReached'           // 3rd consecutive podium — riding the wave
  | 'crashDnf'                  // crashed out of the main
  | 'remount'                   // went down, got back up, finished
  | 'mechanicalDnf'             // bike let go — frustration at the TEAM, not self-doubt
  | 'threwAwayWin'              // led late, lost it himself (the Hunter Lawrence)
  | 'beatenByTeammateForWin'    // teammate took the win you had in hand — extra sting
  | 'hollowWin'                 // won, but got caught & passed on merit (the Jett helmet-throw)
  | 'redemption'                // channeled the anger into a win next time out
  | 'beatExpectation'           // finished well above where his rating says he should
  | 'missedExpectation'         // underperformed his rating with no crash excuse
  | 'badInterview'              // said something dumb to the press
  | 'contractDispute'           // unresolved contract limbo (applied per round by future negotiation system)
  | 'offWeekRest';              // recovery valve

interface MentalDelta {
  confidence?: number;
  tilt?: number;
  fatigue?: number;
  morale?: number;
  label: string;
}

/** The whole catalog is ±1..±3. That is the point. */
const EVENTS: Record<MentalEventType, MentalDelta> = {
  win:                    { confidence: +2, tilt: -2, morale: +2, label: 'Won the main' },
  podium:                 { confidence: +1, morale: +1,           label: 'Podium finish' },
  peakFormReached:        { confidence: +3,                       label: 'Three straight podiums — riding the wave' },
  crashDnf:               { confidence: -3, tilt: +3, morale: -1, label: 'Crashed out' },
  remount:                { confidence: -1, tilt: +2,             label: 'Went down, remounted' },
  mechanicalDnf:          { tilt: +2, morale: -1,                 label: 'Bike failed under him' },
  threwAwayWin:           { confidence: -1, tilt: +3, morale: -1, label: 'Threw away the win late' },
  beatenByTeammateForWin: { tilt: +1,                             label: 'Teammate took the win' },
  hollowWin:              { tilt: +1,                             label: 'Won, but got caught and passed straight-up' },
  redemption:             { confidence: +2, tilt: -2,             label: 'Answered back with the win' },
  beatExpectation:        { confidence: +1, morale: +1,           label: 'Outrode his number' },
  missedExpectation:      { confidence: -1, tilt: +1,             label: 'Underperformed, no excuse' },
  badInterview:           { tilt: +2, morale: -2,                 label: 'Rough interview' },
  contractDispute:        { morale: -3, tilt: +1,                 label: 'Contract limbo' },
  offWeekRest:            { fatigue: -3, morale: +2, tilt: -1,    label: 'Off-week reset' },
};

/** Apply one event. Exported so future systems (media, contracts) can push events too. */
export function pushMentalEvent(r: Rider, type: MentalEventType): void {
  const m = ensureMental(r);
  const d = EVENTS[type];
  if (d.confidence) m.confidence = clamp(m.confidence + d.confidence, 0, 100);
  if (d.tilt) m.tilt = clamp(m.tilt + d.tilt, 0, 100);
  if (d.fatigue) m.fatigue = clamp(m.fatigue + d.fatigue, 0, 100);
  if (d.morale) r.morale = clamp(r.morale + d.morale, 0, 100);
  m.lastEvents.unshift(d.label);
  if (m.lastEvents.length > 6) m.lastEvents.length = 6;
}

// ------------------------------------------------------------- expectation

/**
 * Where a rider "should" finish: his overall-rating rank within the field.
 * Best-rated rider in a 40-man gate expects to win; 20th-rated expects P20.
 */
export function expectedFinish(rider: Rider, fieldIds: string[], u: Universe): number {
  const mine = rider.overall;
  let rank = 1;
  for (const id of fieldIds) {
    if (id === rider.id) continue;
    const other = u.riders[id];
    if (other && other.overall > mine) rank++;
  }
  return rank;
}

// ------------------------------------------------------------- weekend processing

export interface MentalStoryline {
  riderId: string;
  text: string;
}

/**
 * Post-race psychology pass for one weekend. Reads the MAIN race only
 * (qualifying-race drama doesn't move the needle). Returns notable
 * storylines for the message feed; the caller decides which to surface.
 */
export function processWeekendPsychology(u: Universe, w: WeekendResult): MentalStoryline[] {
  const stories: MentalStoryline[] = [];
  const main = w.sessions[w.sessions.length - 1];
  if (!main) return stories;

  const finishOrder = w.finishOrder;
  const winnerId = finishOrder[0];
  const winner = u.riders[winnerId];

  // Who led in the final third of the main but didn't win? (thrown-away win)
  const lapOrder = main.outcome.lapOrder;
  const lateStart = Math.floor(lapOrder.length * 0.66);
  const lateLeaders = new Set<string>();
  for (let lap = lateStart; lap < lapOrder.length; lap++) {
    if (lapOrder[lap]?.[0]) lateLeaders.add(lapOrder[lap][0]);
  }

  // Incidents in the main, per rider
  const crashed = new Set<string>();
  const remounted = new Set<string>();
  const mechanical = new Set<string>();
  for (const ev of main.outcome.events) {
    if (ev.kind === 'crash') crashed.add(ev.riderId);
    if (ev.kind === 'remount') remounted.add(ev.riderId);
    if (ev.kind === 'mechanical') mechanical.add(ev.riderId);
  }

  // Riders who led the final third but lost it to their own incident
  const throwers = [...lateLeaders].filter(id =>
    id !== winnerId && (crashed.has(id) || remounted.has(id)));

  finishOrder.forEach((riderId, idx) => {
    const r = u.riders[riderId];
    if (!r) return;
    const m = ensureMental(r);
    const pos = idx + 1;
    const won = pos === 1;
    const podium = pos <= 3;

    // racing costs mental energy — one point a round, recovered on rest
    m.fatigue = clamp(m.fatigue + 1, 0, 100);

    // --- streaks first (need pre-race counters)
    if (won) {
      m.consecutiveWins += 1;
      m.consecutivePodiums += 1;
    } else if (podium) {
      m.consecutiveWins = 0;
      m.consecutivePodiums += 1;
    } else {
      m.consecutiveWins = 0;
      m.consecutivePodiums = 0;
    }
    const hadPeak = m.peakForm;
    m.peakForm = m.consecutivePodiums >= 3;
    if (m.peakForm && !hadPeak) {
      pushMentalEvent(r, 'peakFormReached');
      stories.push({ riderId, text: `${r.name} is riding the wave — three straight podiums.` });
    }

    // --- results
    if (won) {
      // redemption: rode in angry from a robbery last time out and answered with the win
      if (m.angerCharge >= 15) {
        pushMentalEvent(r, 'redemption');
        stories.push({ riderId, text: `${r.name} channeled the anger and answered back with the win.` });
      }
      m.angerCharge = 0;
      pushMentalEvent(r, 'win');
      // the Jett helmet-throw: inherited the win from a late leader's fall after
      // being caught and passed on merit — winning wrong still stings
      if (throwers.length > 0 && !lateLeaders.has(riderId)) {
        pushMentalEvent(r, 'hollowWin');
        stories.push({ riderId, text: `${r.name} takes a win he didn't want — he was caught and passed before inheriting it.` });
      }
    } else if (podium) {
      pushMentalEvent(r, 'podium');
    }

    // --- the Hunter Lawrence: led late, lost it himself, still classified
    const threwItAway = lateLeaders.has(riderId) && !won && (remounted.has(riderId) || crashed.has(riderId));
    if (threwItAway) {
      pushMentalEvent(r, 'threwAwayWin');
      m.angerCharge = clamp(m.angerCharge + 30, 0, 100); // fuel for next weekend
      const byTeammate = winner && winner.teamId != null && winner.teamId === r.teamId;
      if (byTeammate) {
        pushMentalEvent(r, 'beatenByTeammateForWin');
        m.angerCharge = clamp(m.angerCharge + 10, 0, 100);
        stories.push({ riderId, text: `${r.name} threw away the win and watched his own teammate take it. He is FURIOUS with P${pos}.` });
      } else {
        stories.push({ riderId, text: `${r.name} had the win in hand and lost it late — P${pos} feels like a loss.` });
      }
    } else if (crashed.has(riderId)) {
      pushMentalEvent(r, 'crashDnf');
    } else if (remounted.has(riderId)) {
      pushMentalEvent(r, 'remount');
    } else if (mechanical.has(riderId)) {
      pushMentalEvent(r, 'mechanicalDnf');
    }

    // --- expectation vs outcome (only when there's no incident excuse)
    const cleanRace = !crashed.has(riderId) && !remounted.has(riderId) && !mechanical.has(riderId);
    if (cleanRace && !threwItAway) {
      const expected = expectedFinish(r, finishOrder, u);
      const delta = expected - pos; // positive = beat expectation
      if (delta >= 5) {
        pushMentalEvent(r, 'beatExpectation');
        if (delta >= 12) stories.push({ riderId, text: `${r.name} rode way over his head — expected P${expected}, brought it home P${pos}.` });
      } else if (delta <= -5 && !won && !podium) {
        pushMentalEvent(r, 'missedExpectation');
      }
    }
  });

  return stories;
}

// ------------------------------------------------------------- per-round drift

/**
 * Called once per round BEFORE racing: mental states drift back toward
 * baseline. Frustration cools fastest; confidence fades slowly; riders who
 * aren't racing (injured/bench) recover fatigue.
 */
export function decayAllMentalStates(u: Universe): void {
  for (const r of Object.values(u.riders)) {
    const m = ensureMental(r);
    if (m.confidence > 50) m.confidence -= 1;
    else if (m.confidence < 50) m.confidence += 1;
    if (m.tilt > 0) m.tilt = Math.max(0, m.tilt - 2);
    m.angerCharge = Math.floor(m.angerCharge / 2); // anger burns hot, burns out (~3 rounds)
    if (r.bench || r.injuredForRounds > 0) m.fatigue = Math.max(0, m.fatigue - 2);
  }
}

// ------------------------------------------------------------- race-day modifiers

/**
 * Lap-time multiplier. Hard-capped at ±1%; a typical mildly-tilted rider
 * sits around ±0.1-0.3%. Peak form adds the "everything feels +1" edge.
 */
export function mentalPaceFactor(r: Rider): number {
  const m = r.mental;
  if (!m) return 1;
  const conf = (m.confidence - 50) * 0.00008;  // ±0.4% at the extremes
  const tilt = m.tilt * 0.00005;               // up to +0.5% slower
  const fat = m.fatigue * 0.00002;             // up to +0.2% slower
  const peak = m.peakForm ? 0.001 : 0;         // riding the wave: +0.1%
  const anger = m.angerCharge * 0.00002;       // anger is fuel: up to +0.2% faster...
  return clamp(1 - conf - peak - anger + tilt + fat, 0.99, 1.01);
}

/** Crash-chance multiplier. A tilted rider forces it; capped well short of doubling. */
export function mentalCrashFactor(r: Rider): number {
  const m = r.mental;
  if (!m) return 1;
  // ...but anger cuts both ways: a confident angry rider holds it together
  // (Hunter, RedBud moto 2); a rattled angry rider forces it and goes down
  // ("emotion gets in the way").
  const angerRisk = m.confidence >= 50 ? m.angerCharge * 0.0005 : m.angerCharge * 0.0018;
  const f = 1 + m.tilt * 0.0025 - (m.confidence - 50) * 0.0008 + angerRisk;
  return clamp(f, 0.92, 1.35);
}

/** Additive seconds on the launch (lower = better). Confidence steadies the gate drop. */
export function mentalStartAdjust(r: Rider): number {
  const m = r.mental;
  if (!m) return 0;
  return (50 - m.confidence) * 0.003 + (m.peakForm ? -0.08 : 0); // ±0.15s
}
