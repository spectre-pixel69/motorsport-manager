import { render } from 'preact';
import { useState } from 'preact/hooks';
import './style.css';
import { BRAND } from './data/brand';
import { loadCareer, deleteSave, saveCareer, type CareerState } from './game/state';
import { getTelemetry } from './util/telemetry';
import { NewGame } from './ui/NewGame';
import { Hub } from './ui/Hub';
import { TeamDashboard } from './ui/TeamDashboard';
import { RaceView } from './ui/RaceView';
import type { WeekendResult } from './sim/weekend';

type Screen =
  | { id: 'title' }
  | { id: 'new' }
  | { id: 'hub'; state: CareerState }
  | { id: 'dashboard'; state: CareerState }
  | { id: 'race'; state: CareerState; weekends: WeekendResult[]; player: WeekendResult };

function App() {
  const [screen, setScreen] = useState<Screen>({ id: 'title' });
  const hasSave = loadCareer() !== null;

  return (
    <>
      <div class="rotate-overlay">
        <div class="phone" />
        <h2>Rotate your device</h2>
        <p class="muted">{BRAND.gameName} runs in landscape — like a proper pit wall.</p>
      </div>

      {screen.id === 'title' && (
        <div class="screen title-screen">
          <div class="title-logo">PADDOCK <span class="boss">BOSS</span></div>
          <div class="title-tag">{BRAND.tagline}</div>
          <div style="height:18px" />
          <div class="row">
            {hasSave && (
              <button class="primary" onClick={() => {
                const s = loadCareer();
                if (s) setScreen({ id: 'hub', state: s });
              }}>Continue Career</button>
            )}
            <button class={hasSave ? '' : 'primary'} onClick={() => setScreen({ id: 'new' })}>New Career</button>
            {hasSave && (
              <button class="ghost" onClick={() => { deleteSave(); setScreen({ id: 'title' }); }}>Delete Save</button>
            )}
          </div>
          <div style="height:10px" />
          <p class="muted">v0.1 — GP &middot; SBK &middot; NAMC</p>
        </div>
      )}

      {screen.id === 'new' && (
        <NewGame
          onBack={() => setScreen({ id: 'title' })}
          onStart={state => setScreen({ id: 'hub', state })}
        />
      )}

      {screen.id === 'hub' && (
        <Hub
          state={screen.state}
          onExit={() => { saveCareer(screen.state); setScreen({ id: 'title' }); }}
          onRaceReady={(weekends, player) => {
            if (player) setScreen({ id: 'race', state: screen.state, weekends, player });
            else setScreen({ id: 'hub', state: screen.state });
          }}
          onViewDashboard={() => setScreen({ id: 'dashboard', state: screen.state })}
        />
      )}

      {screen.id === 'dashboard' && (
        <TeamDashboard
          state={screen.state}
          onExit={() => { saveCareer(screen.state); setScreen({ id: 'hub', state: screen.state }); }}
        />
      )}

      {screen.id === 'race' && (() => {
        const main = screen.player.sessions[screen.player.sessions.length - 1];
        const track = screen.state.universe.tracks[screen.player.trackId];
        return (
          <RaceView
            u={screen.state.universe}
            title={`${track.name} — ${main.name}`}
            outcome={main.outcome}
            playerTeamId={screen.state.playerTeamId}
            onDone={() => setScreen({ id: 'hub', state: screen.state })}
          />
        );
      })()}
    </>
  );
}

render(<App />, document.getElementById('app')!);
