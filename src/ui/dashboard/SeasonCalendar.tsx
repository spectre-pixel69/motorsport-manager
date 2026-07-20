// Season Calendar - rounds with track info and previous results

import type { CareerState } from '../../game/state';
import { WEEKLY_LEAGUE_REVENUE_GP, REVENUE_SPLIT_GP } from '../../data/gp';
import { WEEKLY_LEAGUE_REVENUE_SBK, REVENUE_SPLIT_SBK } from '../../data/sbk';

interface Props {
  state: CareerState;
  onClose: () => void;
}

function getTrackType(kind: string): string {
  switch (kind) {
    case 'road': return '🏁 Road';
    case 'stadium': return '🏟️ Stadium';
    case 'national': return '⛰️ National';
    default: return '📍 ' + kind;
  }
}

export function SeasonCalendar({ state, onClose }: Props) {
  const u = state.universe;
  const cal = u.calendars[state.discipline];
  const currentRound = state.round;
  const roundsCompleted = Math.min(currentRound, cal.length);
  const isNamc = state.discipline === 'namc';

  // NAMC: fixed $800k/round purse across 4 classes, 25% to riders (rulebook §budget).
  // GP/SBK: revenue-share model instead of a flat purse — different weekly
  // league revenue and rider cut per discipline (src/data/gp.ts, src/data/sbk.ts).
  const pursePerRound = 800_000;
  const totalPurse = pursePerRound * cal.length;
  const weeklyRevenue = state.discipline === 'gp' ? WEEKLY_LEAGUE_REVENUE_GP
    : state.discipline === 'sbk' ? WEEKLY_LEAGUE_REVENUE_SBK : 0;
  const riderShare = state.discipline === 'gp' ? REVENUE_SPLIT_GP.riders
    : state.discipline === 'sbk' ? REVENUE_SPLIT_SBK.riders : 0;
  const totalRevenue = weeklyRevenue * cal.length;

  return (
    <div class="modal-content">
      <div class="modal-header">
        <h2>📅 Season Calendar</h2>
        <button class="modal-close" onClick={onClose}>✕</button>
      </div>

      <div class="modal-body">
        <div class="calendar-container">
          {/* Racing Schedule */}
          <div class="calendar-section">
            <h3>Racing Schedule — {roundsCompleted}/{cal.length} Complete</h3>
            <div class="rounds-list">
              {cal.map((round, idx) => {
                const track = u.tracks[round.trackId];
                const isCompleted = idx < currentRound;
                const isCurrent = idx === currentRound;
                const raceHist = state.history.find(h => h.round === idx + 1);

                return (
                  <div
                    class={`round-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    key={idx}
                  >
                    <div class="round-left">
                      <span class="round-badge">{round.round}</span>
                      <div class="round-info">
                        <div class="track-name">{track?.name}</div>
                        <div class="track-meta">
                          {track?.location} · {getTrackType(track?.kind ?? 'unknown')}
                        </div>
                      </div>
                    </div>
                    <div class="round-right">
                      {isCompleted && raceHist && (
                        <div class="result">
                          <span class="winner">🏆 {raceHist.winnerName}</span>
                          <span class="your-best" title="Your best finish">
                            You: {raceHist.playerBest}
                          </span>
                        </div>
                      )}
                      {isCompleted && !raceHist && (
                        <div class="badge completed">✓ Complete</div>
                      )}
                      {isCurrent && (
                        <div class="badge current">→ Next</div>
                      )}
                      {!isCompleted && !isCurrent && (
                        <div class="badge pending">Pending</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Off-Season */}
          <div class="calendar-section off-season">
            <h3>🗓️ Off-Season Window</h3>
            <p class="off-season-text">
              After Round {cal.length}:
            </p>
            {isNamc ? (
              <div class="off-season-grid">
                <div class="activity">🏆 Champions crowned, legacy plates awarded</div>
                <div class="activity">💰 Prize money distributed by championship</div>
                <div class="activity">📋 Retirements processed, Free Agency opens</div>
                <div class="activity">🎯 NAMC Draft (reverse standings order)</div>
                <div class="activity">🤝 Free agent signings by team</div>
                <div class="activity">🔧 R&D investment, bike development</div>
              </div>
            ) : (
              <div class="off-season-grid">
                <div class="activity">🏆 Champions crowned, legacy plates awarded</div>
                <div class="activity">📈 Riders age, train and develop toward potential</div>
                <div class="activity">
                  📋 Rosters carry over — {state.discipline === 'gp' ? 'GP' : 'SBK'} contract
                  expiry, retirement and free agency aren't wired up yet
                </div>
              </div>
            )}
          </div>

          {/* Season Totals */}
          <div class="calendar-section info">
            <h3>💰 Season Economics</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Current Season</span>
                <span class="value">{state.season}</span>
              </div>
              <div class="info-item">
                <span class="label">Progress</span>
                <span class="value">{roundsCompleted}/{cal.length} rounds ({Math.round((roundsCompleted / cal.length) * 100)}%)</span>
              </div>
              {isNamc ? (
                <>
                  <div class="info-item">
                    <span class="label">Purse per round</span>
                    <span class="value">${(pursePerRound / 1000).toFixed(0)}k (25% to riders)</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Total season purse</span>
                    <span class="value">${(totalPurse / 1_000_000).toFixed(1)}M</span>
                  </div>
                </>
              ) : (
                <>
                  <div class="info-item">
                    <span class="label">League revenue per round</span>
                    <span class="value">${(weeklyRevenue / 1_000_000).toFixed(1)}M ({Math.round(riderShare * 100)}% to rider purses)</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Total season revenue</span>
                    <span class="value">${(totalRevenue / 1_000_000).toFixed(1)}M</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
