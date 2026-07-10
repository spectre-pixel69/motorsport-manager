// Telemetry Framework: tracks player actions and game state for alpha testing analysis

import type { CareerState } from '../game/state';
import type { WeekendResult } from '../sim/weekend';

export type TelemetryEventType =
  | 'career_create'
  | 'race_start'
  | 'race_end'
  | 'budget_transaction'
  | 'ai_decision'
  | 'race_lap';

export interface TelemetryEvent {
  timestamp: number;                           // Epoch milliseconds
  sessionId: string;                           // Unique session ID
  eventType: TelemetryEventType;
  data: Record<string, any>;                   // Event-specific data
}

export interface TelemetrySession {
  sessionId: string;
  createdAt: number;
  teamName: string;
  discipline: string;
  seed: number;
  season: number;
  events: TelemetryEvent[];
}

// Global telemetry state (in-memory)
let currentSession: TelemetrySession | null = null;

/**
 * Initialize a new telemetry session (called at career start)
 */
export function initTelemetry(teamName: string, discipline: string, seed: number, season: number): string {
  const sessionId = `tel_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  currentSession = {
    sessionId,
    createdAt: Date.now(),
    teamName,
    discipline,
    seed,
    season,
    events: [],
  };
  return sessionId;
}

/**
 * Log a telemetry event
 */
export function logEvent(eventType: TelemetryEventType, data: Record<string, any>): void {
  if (!currentSession) return;
  const event: TelemetryEvent = {
    timestamp: Date.now(),
    sessionId: currentSession.sessionId,
    eventType,
    data,
  };
  currentSession.events.push(event);
}

/**
 * Log career creation event
 */
export function logCareerCreate(state: CareerState): void {
  const team = state.universe.teams[state.playerTeamId];
  logEvent('career_create', {
    round: state.round,
    teamName: team.name,
    discipline: state.discipline,
    championship: state.championship,
    colors: team.colors,
    budget: team.budget,
    prestige: team.prestige,
    seed: state.seed,
    season: state.season,
  });
}

/**
 * Log race start event
 */
export function logRaceStart(state: CareerState, round: number, trackId: string): void {
  const track = state.universe.tracks[trackId];
  logEvent('race_start', {
    round,
    trackId,
    trackName: track.name,
    trackKind: track.kind,
    championship: state.championship,
    focusClass: state.focusClass,
  });
}

/**
 * Log race end event with results
 */
export function logRaceEnd(state: CareerState, weekends: WeekendResult[], playerWeekend: WeekendResult | null): void {
  if (!playerWeekend) return;

  const track = state.universe.tracks[playerWeekend.trackId];
  const playerRider = playerWeekend.finishOrder.find(id => state.universe.riders[id]?.teamId === state.playerTeamId);
  const playerFinishPos = playerRider ? playerWeekend.finishOrder.indexOf(playerRider) + 1 : 0;
  const playerPoints = playerRider ? playerWeekend.points[playerRider] ?? 0 : 0;

  // Collect mechanical failures across the weekend
  const mechanicalFailures = playerWeekend.sessions.reduce((count, session) => {
    return count + session.outcome.events.filter(e => e.kind === 'mechanical').length;
  }, 0);

  // Top 5 finishers
  const topFinishers = playerWeekend.finishOrder.slice(0, 5).map(riderId => {
    const rider = state.universe.riders[riderId];
    const points = playerWeekend.points[riderId] ?? 0;
    return {
      driverId: riderId,
      driverName: rider.name,
      team: rider.teamId ? state.universe.teams[rider.teamId].name : 'Unknown',
      points,
    };
  });

  logEvent('race_end', {
    round: state.round,
    trackId: playerWeekend.trackId,
    trackName: track.name,
    trackKind: track.kind,
    playerFinish: playerFinishPos,
    playerPoints,
    playerBest: playerFinishPos ? `P${playerFinishPos}` : 'DNF',
    topFinishers,
    mechanicalFailures,
    weatherCondition: playerWeekend.sessions[0]?.outcome.weather ?? 'unknown',
    championship: playerWeekend.championship,
    classId: playerWeekend.classId,
  });
}

/**
 * Log budget transaction (part purchase, salary, R&D investment)
 */
export function logBudgetTransaction(
  type: 'purchase' | 'salary' | 'investment' | 'repair' | 'other',
  amount: number,
  category: string,
  description: string,
  newBudget: number
): void {
  logEvent('budget_transaction', {
    type,
    amount,
    category,
    description,
    newBudget,
  });
}

/**
 * Log AI team decision (signings, strategy changes)
 */
export function logAIDecision(
  teamId: string,
  teamName: string,
  decision: 'signing' | 'strategy_change' | 'budget_allocation' | 'setup_change',
  details: Record<string, any>
): void {
  logEvent('ai_decision', {
    teamId,
    teamName,
    decision,
    ...details,
  });
}

/**
 * Get all telemetry events
 */
export function getTelemetry(): TelemetrySession | null {
  return currentSession;
}

/**
 * Export telemetry as JSON (ready for download)
 */
export function exportTelemetry(): string {
  if (!currentSession) {
    return JSON.stringify({ error: 'No active telemetry session' }, null, 2);
  }

  const export_data = {
    metadata: {
      version: '1.0',
      gameVersion: '0.1.0',
      exportedAt: new Date().toISOString(),
      sessionId: currentSession.sessionId,
      sessionDuration: Math.round((Date.now() - currentSession.createdAt) / 1000),
    },
    session: currentSession,
    summary: {
      totalEvents: currentSession.events.length,
      eventsByType: summarizeEventsByType(currentSession.events),
    },
  };

  return JSON.stringify(export_data, null, 2);
}

/**
 * Helper: summarize event counts by type
 */
function summarizeEventsByType(events: TelemetryEvent[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const event of events) {
    summary[event.eventType] = (summary[event.eventType] ?? 0) + 1;
  }
  return summary;
}

/**
 * Clear telemetry session (on new career or reset)
 */
export function clearTelemetry(): void {
  currentSession = null;
}

/**
 * Attach telemetry to career state for persistence
 */
export function attachTelemetryToState(state: CareerState): CareerState & { _telemetry?: TelemetrySession } {
  const enhanced = state as CareerState & { _telemetry?: TelemetrySession };
  if (currentSession) {
    enhanced._telemetry = currentSession;
  }
  return enhanced;
}

/**
 * Restore telemetry from saved career state
 */
export function restoreTelemetryFromState(state: any): void {
  const enhanced = state as CareerState & { _telemetry?: TelemetrySession };
  if (enhanced._telemetry) {
    currentSession = enhanced._telemetry;
  }
}
