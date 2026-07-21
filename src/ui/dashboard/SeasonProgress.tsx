// Season Progress Bar - Shows current round position within 20-round season

import type { CareerState } from '../../game/state';

interface Props {
  state: CareerState;
  currentRound: number;
  totalRounds: number;
}

export function SeasonProgress({ state, currentRound, totalRounds }: Props) {
  const progressPercent = (currentRound / totalRounds) * 100;
  const cal = state.universe.calendars[state.discipline];
  const nextRound = currentRound < cal.length ? cal[currentRound] : null;
  const nextTrack = nextRound ? state.universe.tracks[nextRound.trackId] : null;

  return (
    <div class="season-progress">
      <div class="progress-info">
        <h3>Season Progress</h3>
        <span class="round-label">Round {currentRound}/{totalRounds}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style={{ width: `${progressPercent}%` }} />
        {Array.from({ length: Math.min(totalRounds, 20) }).map((_, i) => (
          <div
            key={i}
            class={`progress-marker ${i < currentRound ? 'completed' : i === currentRound ? 'active' : ''}`}
            style={{ left: `${(i / totalRounds) * 100}%` }}
          />
        ))}
      </div>
      {nextTrack && (
        <div class="next-race-preview">
          <span class="next-label">Next Race:</span>
          <span class="track-name">{nextTrack.name}</span>
        </div>
      )}
    </div>
  );
}
