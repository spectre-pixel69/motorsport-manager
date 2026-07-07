// Staff Showroom - Hire mechanics, designers, and specialists

import { useState } from 'preact/hooks';
import type { CareerState } from '../../game/state';
import { ALL_STAFF } from '../../data/staff';
import type { Staff, StaffRole } from '../../data/staff';
import './showroom.css';

interface Props {
  state: CareerState;
  onExit: () => void;
}

const ROLES: StaffRole[] = ['chief-designer', 'lead-mechanic', 'electronics-tech'];

const ROLE_LABELS = {
  'chief-designer': '🎨 Chief Designer',
  'lead-mechanic': '🔧 Lead Mechanic',
  'electronics-tech': '⚡ Electronics Tech',
};

export function StaffShowroom({ state, onExit }: Props) {
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const team = state.universe.teams[state.playerTeamId];

  const handleToggleStaff = (staffId: string) => {
    const updated = new Set(selectedStaff);
    if (updated.has(staffId)) {
      updated.delete(staffId);
    } else {
      updated.add(staffId);
    }
    setSelectedStaff(updated);
  };

  const calculateTotalCost = (): number => {
    return Array.from(selectedStaff).reduce((sum, staffId) => {
      const staff = ALL_STAFF[staffId];
      return sum + (staff?.salary || 0);
    }, 0);
  };

  const totalCost = calculateTotalCost();
  const budgetRemaining = team.budget - totalCost;

  return (
    <div class="showroom-container">
      <div class="showroom-header">
        <h1>👥 Staff & Hiring Center</h1>
        <div class="showroom-info">
          <span class="budget-display">
            Total Payroll: <strong>${totalCost.toLocaleString()}</strong>
          </span>
          <button class="btn-close" onClick={onExit}>← Back</button>
        </div>
      </div>

      <div class="staff-grid">
        {ROLES.map(role => {
          const staffForRole = Object.values(ALL_STAFF).filter(s => s.role === role);
          return (
            <div class="staff-section" key={role}>
              <h3 class="role-title">{ROLE_LABELS[role]}</h3>

              <div class="staff-list">
                {staffForRole.map(staff => (
                  <div
                    class={`staff-card ${selectedStaff.has(staff.id) ? 'hired' : ''}`}
                    key={staff.id}
                  >
                    <div class="staff-header">
                      <div class="staff-info">
                        <h4>{staff.name}</h4>
                        <span class="experience">{staff.experience}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedStaff.has(staff.id)}
                        onChange={() => handleToggleStaff(staff.id)}
                        class="staff-checkbox"
                      />
                    </div>

                    <div class="staff-details">
                      <div class="salary">
                        Salary: <strong>${staff.salary.toLocaleString()}</strong>/yr
                      </div>
                      <div class="description">{staff.description}</div>
                      <div class="specialties">
                        {staff.specialties.map(spec => (
                          <span class="specialty-badge" key={spec}>
                            {spec.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                      <div class="rd-tier">
                        R&D Unlock: Tier {staff.rdUnlockTier} • Max Bonus: Tier {staff.maxBonusTier}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div class="staff-footer">
        <div class="budget-info">
          <span>Annual Payroll: <strong>${totalCost.toLocaleString()}</strong></span>
          <span>Budget Remaining: <strong class={budgetRemaining < 0 ? 'over-budget' : 'in-budget'}>${budgetRemaining.toLocaleString()}</strong></span>
        </div>
        <button class="btn-confirm" disabled={budgetRemaining < 0}>
          ✓ Confirm Staff Hiring
        </button>
      </div>
    </div>
  );
}
