// Season Calendar - 20 rounds + 2-week off-season timeline

import type { CareerState } from '../../game/state';
import { classById } from '../../data/classes';

interface Props {
  state: CareerState;
  onClose: () => void;
}

export function SeasonCalendar({ state, onClose }: Props) {
  const u = state.universe;
  const cal = u.calendars[state.discipline];
  const currentRound = state.round;

  return (
    <div class="modal-content">
      <div class="modal-header">
        <h2>Season Calendar</h2>
        <button class="modal-close" onClick={onClose}>✕</button>
      </div>

      <div class="modal-body">
        <div class="calendar-container">
          {/* Racing Schedule */}
          <div class="calendar-section">
            <h3>Racing Schedule (20 Rounds)</h3>
            <div class="rounds-grid">
              {cal.map((round, idx) => {
                const track = u.tracks[round.trackId];
                const isCompleted = idx < currentRound;
                const isCurrent = idx === currentRound;

                return (
                  <div
                    class={`round-card ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    key={idx}
                  >
                    <div class="round-number">Round {round.round}</div>
                    <div class="track-name">{track?.name || 'Unknown'}</div>
                    <div class="track-location">{track?.location || ''}</div>
                    {isCompleted && <div class="badge completed">✓ Complete</div>}
                    {isCurrent && <div class="badge current">→ Next Race</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Off-Season */}
          <div class="calendar-section off-season">
            <h3>Off-Season Window</h3>
            <p class="off-season-text">
              2-week break after Round 20 for:
            </p>
            <ul class="off-season-activities">
              <li>🏆 Championships resolved</li>
              <li>💰 Prize money distributed</li>
              <li>📋 Draft pool opens</li>
              <li>🤝 Free agent signings</li>
              <li>🔧 Bike development & R&D</li>
              <li>👥 Staff hiring/firing</li>
            </ul>
          </div>

          {/* Season Info */}
          <div class="calendar-section info">
            <h3>Season Info</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Current Season</span>
                <span class="value">{state.season}</span>
              </div>
              <div class="info-item">
                <span class="label">Progress</span>
                <span class="value">{currentRound}/{cal.length} rounds</span>
              </div>
              <div class="info-item">
                <span class="label">Total Purse</span>
                <span class="value">${(800_000 * cal.length * 1_000_000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
