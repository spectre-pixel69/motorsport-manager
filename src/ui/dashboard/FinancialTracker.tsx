// Financial Tracker - Weekly costs, earnings, budget status, quick actions

import type { ClassId, Team, Rider } from '../../data/types';

interface StandingEntry {
  rider: any;
  pts: number;
}

interface Props {
  team: Team;
  myRiders: Rider[];
  classId: ClassId;
  standings: StandingEntry[];
}

export function FinancialTracker({ team, myRiders, classId, standings }: Props) {
  // Calculate weekly costs for this class's riders
  const weeklyPayroll = myRiders.reduce((sum, r) => sum + (r.salary / 52), 0);

  // Estimate weekly earnings from standings (simplified: avg points / total possible * purse)
  const avgPointsPerRider = standings.length > 0
    ? standings.reduce((sum, s) => sum + s.pts, 0) / standings.length
    : 0;

  const RACE_PURSE = 800000;
  const estimatedWeeklyEarnings = (avgPointsPerRider / 250) * (RACE_PURSE * 0.25); // 25% rider pool

  const netWeeklyFlow = estimatedWeeklyEarnings - weeklyPayroll;

  // Budget status
  const seasonSpend = myRiders.reduce((sum, r) => sum + r.salary, 0);
  const budgetRemaining = team.budget;

  return (
    <div class="financial-tracker">
      {/* Weekly Summary */}
      <div class="financial-box weekly-summary">
        <h3>Weekly Summary</h3>
        <div class="financial-row">
          <span class="label">Total weekly payroll</span>
          <span class="value">${Math.round(weeklyPayroll).toLocaleString()}</span>
        </div>
        <div class="financial-row">
          <span class="label">Expected purse earnings</span>
          <span class="value success">${Math.round(estimatedWeeklyEarnings).toLocaleString()}</span>
        </div>
        <div class="financial-row total">
          <span class="label">Net weekly cash flow</span>
          <span class={`value ${netWeeklyFlow >= 0 ? 'success' : 'warning'}`}>
            {netWeeklyFlow >= 0 ? '+' : '−'}${Math.round(Math.abs(netWeeklyFlow)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Season Summary */}
      <div class="financial-box season-summary">
        <h3>Season Summary</h3>
        <div class="financial-row">
          <span class="label">Season budget remaining</span>
          <span class="value">${Math.round(budgetRemaining).toLocaleString()}</span>
        </div>
        <div class="financial-row">
          <span class="label">Total spent to date</span>
          <span class="value">${Math.round(seasonSpend).toLocaleString()}</span>
        </div>
        <div class="financial-row">
          <span class="label">Projected season cost</span>
          <span class="value">${Math.round(seasonSpend * 2).toLocaleString()}</span>
        </div>

        {/* Budget Bar */}
        <div class="budget-bar-container">
          <div class="budget-bar">
            <div
              class="budget-fill"
              style={{ width: `${Math.min(100, (seasonSpend / (seasonSpend + budgetRemaining)) * 100)}%` }}
            />
          </div>
          <span class="budget-limit">Limit: $2,500,000</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <button class="btn-action">View Draft Pool</button>
        <button class="btn-action">View Free Agents</button>
        <button class="btn-action">Season Calendar</button>
      </div>
    </div>
  );
}
