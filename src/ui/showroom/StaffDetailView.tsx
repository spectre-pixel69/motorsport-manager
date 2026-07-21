// Staff Detail View - Zoom view of a staff member's profile and contract

import type { Staff } from '../../data/staff';
import type { Team } from '../../data/types';

interface Props {
  staff: Staff;
  team: Team;
  hired: boolean;
  onToggleHire: () => void;
  onBack: () => void;
}

const ROLE_LABELS: Record<Staff['role'], string> = {
  'chief-designer': '🎨 Chief Designer',
  'lead-mechanic': '🔧 Lead Mechanic',
  'electronics-tech': '⚡ Electronics Tech',
};

const EXPERIENCE_LABELS: Record<Staff['experience'], string> = {
  expert: 'Expert — factory-level pedigree',
  experienced: 'Experienced — proven mid-tier operator',
  junior: 'Junior — raw talent, low cost',
};

export function StaffDetailView({ staff, team, hired, onToggleHire, onBack }: Props) {
  const budgetRemaining = team.budget - staff.salary;

  return (
    <div class="detail-view">
      <button class="btn-back" onClick={onBack}>← Back to Hiring Center</button>

      <div class="detail-content">
        {/* Left: Identity + passive bonus */}
        <div class="detail-left">
          <div class="item-image">
            <div class="item-icon-large">🧑‍🔧</div>
            <h2>{staff.name}</h2>
            <p class="manufacturer">{ROLE_LABELS[staff.role]}</p>
          </div>

          <div class="ovr-bonuses">
            <h4>Passive Bike Bonus</h4>
            {staff.ovrBonus && Object.entries(staff.ovrBonus).length > 0 ? (
              <div class="bonus-list">
                {Object.entries(staff.ovrBonus).map(([pillar, bonus]) => (
                  <div class="bonus-row" key={pillar}>
                    <span class="pillar">{pillar}:</span>
                    <span class="bonus">+{bonus}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p class="none">No passive bonus</p>
            )}
          </div>

          <div class="ovr-bonuses">
            <h4>Specialties</h4>
            <div class="trait-list">
              {staff.specialties.map(spec => (
                <span class="surface-badge" key={spec}>{spec.replace(/-/g, ' ')}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Profile */}
        <div class="detail-center">
          <div class="stats-panel">
            <h3>Profile</h3>

            <div class="stat-item">
              <span class="stat-label">Experience:</span>
              <span class="stat-value">{EXPERIENCE_LABELS[staff.experience]}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Annual Salary:</span>
              <span class="stat-value">${staff.salary.toLocaleString()}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">Weekly Cost:</span>
              <span class="stat-value">${Math.round(staff.salary / 52).toLocaleString()}</span>
            </div>

            <div class="stat-item">
              <span class="stat-label">R&D Unlock Tier:</span>
              <span class="stat-value">Tier {staff.rdUnlockTier}</span>
            </div>
            <div class="meter"><div class="meter-fill grip" style={`width:${(staff.rdUnlockTier / 3) * 100}%`} /></div>

            <div class="stat-item">
              <span class="stat-label">Max Part Bonus Tier:</span>
              <span class="stat-value">Tier {staff.maxBonusTier}</span>
            </div>
            <div class="meter"><div class="meter-fill dur" style={`width:${(staff.maxBonusTier / 3) * 100}%`} /></div>

            <hr />

            <div class="stat-item">
              <span class="stat-label">Scouting Report:</span>
              <p class="description">{staff.description}</p>
            </div>

            <p class="description">
              R&D tiers gate which development paths your team can open; part bonus tier caps
              the tuning bonus this hire can apply to components they maintain.
            </p>
          </div>
        </div>

        {/* Right: Contract + budget */}
        <div class="detail-right">
          <div class="purchase-section">
            <h3>Contract Offer</h3>
            <div class="stat-item">
              <span class="stat-label">Term:</span>
              <span class="stat-value">1 season</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Salary:</span>
              <span class="stat-value">${staff.salary.toLocaleString()}/yr</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Role Slot:</span>
              <span class="stat-value">{ROLE_LABELS[staff.role].replace(/^\S+\s/, '')}</span>
            </div>
          </div>

          <div class="budget-tracker">
            <h4>Budget Status</h4>
            <div class="budget-row">
              <span>Team Budget:</span>
              <span>${team.budget.toLocaleString()}</span>
            </div>
            <div class="budget-row total">
              <span>After This Salary:</span>
              <span class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>
                ${budgetRemaining.toLocaleString()}
              </span>
            </div>
            {budgetRemaining < 0 && (
              <div class="budget-warning">⚠️ Over budget by ${Math.abs(budgetRemaining).toLocaleString()}</div>
            )}
            <button class="btn-confirm" disabled={!hired && budgetRemaining < 0} onClick={onToggleHire}>
              {hired ? '✕ Release from Shortlist' : '✓ Add to Hiring Shortlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
