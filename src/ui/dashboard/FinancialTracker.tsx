// Financial Tracker - Weekly costs, earnings, budget status, round history

import type { ClassId, Team, Rider, Universe } from '../../data/types';
import type { CareerState } from '../../game/state';

interface StandingEntry {
  rider: any;
  pts: number;
}

type ModalType = 'draft' | 'freeagents' | 'calendar';

interface Props {
  team: Team;
  myRiders: Rider[];
  classId: ClassId;
  standings: StandingEntry[];
  state?: CareerState;  // optional: for actual financial data
  onOpenModal?: (modalType: ModalType) => void;
}

export function FinancialTracker({ team, myRiders, classId, standings, state, onOpenModal }: Props) {
  // Calculate weekly costs for this class's riders
  const weeklyPayroll = myRiders.reduce((sum, r) => sum + (r.salary / 52), 0);

  // Get actual earnings from last race if available, otherwise estimate
  let actualEarnings = 0;
  let lastRaceRound = 0;
  if (state && state.leagueHealth.length > 0) {
    const latest = state.leagueHealth[state.leagueHealth.length - 1];
    lastRaceRound = latest.round;
    const teamEntry = latest.ledger.find(l => l.teamId === team.id);
    if (teamEntry) {
      actualEarnings = teamEntry.revenuePool;
    }
  }

  // Estimate weekly earnings for projection
  const avgPointsPerRider = standings.length > 0
    ? standings.reduce((sum, s) => sum + s.pts, 0) / standings.length
    : 0;

  const RACE_PURSE = 800000;
  const estimatedWeeklyEarnings = (avgPointsPerRider / 250) * (RACE_PURSE * 0.25);

  const netWeeklyFlow = (actualEarnings || estimatedWeeklyEarnings) - weeklyPayroll;

  // Budget status
  const seasonSpend = myRiders.reduce((sum, r) => sum + r.salary, 0);
  const budgetRemaining = team.budget;
  const budgetPercent = ((2_500_000 - budgetRemaining) / 2_500_000) * 100;

  // §13.5 Rider Welfare Fund — 100% of Tier 2 fines. Surface this team's
  // contributions alongside the league-wide fund total.
  const welfare = state?.welfareFund;
  const myFines = welfare?.fineHistory.filter(f => f.teamId === team.id) ?? [];
  const myFinesTotal = myFines.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div class="financial-tracker">
      {/* Current Position */}
      <div class="financial-box budget-position">
        <h3>Budget Position</h3>
        <div class="financial-row total">
          <span class="label">Cash on hand</span>
          <span class="value cash">${Math.round(budgetRemaining).toLocaleString()}</span>
        </div>
        <div class="budget-bar-container">
          <div class="budget-bar">
            <div
              class="budget-fill"
              style={{ width: `${Math.min(100, budgetPercent)}%` }}
            />
          </div>
          <span class="budget-limit">Season cap: $2,500,000</span>
        </div>
        <div class="financial-row">
          <span class="label muted">Used</span>
          <span class="value muted">{Math.round(budgetPercent)}%</span>
        </div>
      </div>

      {/* Cash Flow */}
      <div class="financial-box cash-flow">
        <h3>Round Flow</h3>
        <div class="financial-row">
          <span class="label">Payroll ({myRiders.length} riders)</span>
          <span class="value expense">−${Math.round(weeklyPayroll).toLocaleString()}</span>
        </div>
        <div class="financial-row">
          <span class="label">Last purse earned {lastRaceRound > 0 ? `(R${lastRaceRound})` : '(est.)'}</span>
          <span class="value income">+${Math.round(actualEarnings || estimatedWeeklyEarnings).toLocaleString()}</span>
        </div>
        <div class="financial-row total">
          <span class="label">Net per round</span>
          <span class={`value ${netWeeklyFlow >= 0 ? 'income' : 'expense'}`}>
            {netWeeklyFlow >= 0 ? '+' : '−'}${Math.round(Math.abs(netWeeklyFlow)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Projection */}
      <div class="financial-box projection">
        <h3>Season Projection</h3>
        <div class="financial-row">
          <span class="label">Rounds remaining</span>
          <span class="value">{state ? (state.universe.calendars[state.discipline].length - state.round) : '?'}</span>
        </div>
        <div class="financial-row">
          <span class="label">Est. net flow (all rounds)</span>
          <span class={`value ${netWeeklyFlow >= 0 ? 'income' : 'expense'}`}>
            {netWeeklyFlow >= 0 ? '+' : '−'}${Math.round(Math.abs(netWeeklyFlow * (state ? (state.universe.calendars[state.discipline].length - state.round) : 10))).toLocaleString()}
          </span>
        </div>
        <div class="financial-row">
          <span class="label muted">Assumes average purse finishes</span>
        </div>
      </div>

      {/* Breakdown by Rider */}
      {myRiders.length > 0 && (
        <div class="financial-box rider-costs">
          <h3>Rider Cost Breakdown</h3>
          <div class="rider-cost-list">
            {myRiders.map(r => (
              <div key={r.id} class="cost-row">
                <span class="name">#{r.number} {r.name}</span>
                <span class="salary">${(r.salary / 1000).toFixed(0)}k/yr</span>
              </div>
            ))}
          </div>
          <div class="cost-summary">
            <span class="label">Class total</span>
            <span class="value">${(seasonSpend / 1000).toFixed(0)}k/yr</span>
          </div>
        </div>
      )}

      {/* §13.5 Rider Welfare Fund */}
      {welfare && (
        <div class="financial-box welfare-fund">
          <h3>Rider Welfare Fund</h3>
          <div class="financial-row total">
            <span class="label">League fund (§13.5)</span>
            <span class="value income">${Math.round(welfare.totalAccumulated).toLocaleString()}</span>
          </div>
          <div class="financial-row">
            <span class="label muted">Fines collected league-wide</span>
            <span class="value muted">{welfare.fineHistory.length}</span>
          </div>
          <div class="financial-row">
            <span class="label">Your team's contributions</span>
            <span class={`value ${myFinesTotal > 0 ? 'expense' : 'muted'}`}>
              {myFinesTotal > 0 ? `−$${Math.round(myFinesTotal).toLocaleString()}` : '$0'}
            </span>
          </div>
          {myFines.length > 0 && (
            <div class="financial-row">
              <span class="label muted">{myFines.length} fine{myFines.length > 1 ? 's' : ''} — last: {myFines[myFines.length - 1].reason}</span>
            </div>
          )}
          <div class="financial-row">
            <span class="label muted" style={{ fontSize: '10px' }}>100% of Tier 2 fines fund rider welfare (§13.1)</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <button class="btn-action" onClick={() => onOpenModal?.('draft')}>
          View Draft Pool
        </button>
        <button class="btn-action" onClick={() => onOpenModal?.('freeagents')}>
          View Free Agents
        </button>
        <button class="btn-action" onClick={() => onOpenModal?.('calendar')}>
          Season Calendar
        </button>
      </div>
    </div>
  );
}
