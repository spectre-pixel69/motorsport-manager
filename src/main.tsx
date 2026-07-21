import { render } from 'preact';
import { useState } from 'preact/hooks';
import './style.css';
import { BRAND } from './data/brand';
import { loadCareer, deleteSave, saveCareer, advanceSeason, type CareerState, type OffSeasonReport } from './game/state';
import { getTelemetry } from './util/telemetry';
import { NewGame } from './ui/NewGame';
import { HubScreenNew } from './ui/HubScreenNew';
import { TeamDashboard } from './ui/TeamDashboard';
import { RaceView } from './ui/RaceView';
import { Showroom } from './ui/Showroom';
import { Placeholder } from './ui/Placeholder';
import { OffSeason } from './ui/OffSeason';
import { TrainingCenter } from './ui/training/TrainingCenter';
import { PartsManager } from './ui/garage/PartsManager';
import { RDCenter } from './ui/RDCenter';
import { ridersOfTeam } from './data/universe';
import type { WeekendResult } from './sim/weekend';

type Screen =
  | { id: 'title' }
  | { id: 'new' }
  | { id: 'hub'; state: CareerState }
  | { id: 'dashboard'; state: CareerState }
  | { id: 'race'; state: CareerState; weekends: WeekendResult[]; player: WeekendResult }
  | { id: 'showroom'; state: CareerState }
  | { id: 'garage'; state: CareerState }
  | { id: 'training'; state: CareerState }
  | { id: 'rdcenter'; state: CareerState }
  | { id: 'placeholder'; state: CareerState; title: string; note?: string }
  | { id: 'offseason'; state: CareerState; report: OffSeasonReport };

function App() {
  const savedCareer = loadCareer();
  const [screen, setScreen] = useState<Screen>(
    savedCareer ? { id: 'hub', state: savedCareer } : { id: 'new' }
  );

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
            <button class="primary" onClick={() => setScreen({ id: 'new' })}>New Career</button>
          </div>
          <div style="height:8px" />
          <button class="ghost" style="width:100%" onClick={() => { deleteSave(); location.reload(); }}>Delete Save</button>
          <div style="height:10px" />
          <p class="muted">v0.1 — GP &middot; SBK &middot; NAMC</p>
        </div>
      )}


      {screen.id === 'new' && (
        <NewGame
          onBack={() => {
            if (savedCareer) setScreen({ id: 'hub', state: savedCareer });
            else setScreen({ id: 'title' });
          }}
          onStart={state => setScreen({ id: 'hub', state })}
        />
      )}

      {screen.id === 'hub' && (
        <HubScreenNew
          state={screen.state}
          onExit={() => { saveCareer(screen.state); setScreen({ id: 'title' }); }}
          onRaceReady={(weekends, player) => {
            if (player) setScreen({ id: 'race', state: screen.state, weekends, player });
            else setScreen({ id: 'hub', state: screen.state });
          }}
          onViewDashboard={() => setScreen({ id: 'dashboard', state: screen.state })}
          onOpenShowroom={() => setScreen({ id: 'showroom', state: screen.state })}
          onOpenGarage={() => setScreen({ id: 'garage', state: screen.state })}
          onOpenTraining={() => setScreen({ id: 'training', state: screen.state })}
          onOpenRDCenter={() => setScreen({ id: 'rdcenter', state: screen.state })}
          onOpenPlaceholder={(title, note) => setScreen({ id: 'placeholder', state: screen.state, title, note })}
          onRunOffSeason={() => {
            const report = advanceSeason(screen.state);
            saveCareer(screen.state);
            setScreen({ id: 'offseason', state: screen.state, report });
          }}
        />
      )}

      {screen.id === 'dashboard' && (
        <TeamDashboard
          state={screen.state}
          onExit={() => { saveCareer(screen.state); setScreen({ id: 'hub', state: screen.state }); }}
        />
      )}

      {screen.id === 'showroom' && (
        <Showroom state={screen.state} onExit={() => { saveCareer(screen.state); setScreen({ id: 'hub', state: screen.state }); }} />
      )}

      {screen.id === 'training' && (() => {
        const team = screen.state.universe.teams[screen.state.playerTeamId];
        return (
          <TrainingCenter
            riders={ridersOfTeam(screen.state.universe, team.id)}
            facilityLevel={team.facilityLevel}
            coachQuality={team.coachQuality}
            onClose={() => { saveCareer(screen.state); setScreen({ id: 'hub', state: screen.state }); }}
          />
        );
      })()}

      {screen.id === 'garage' && (() => {
        const team = screen.state.universe.teams[screen.state.playerTeamId];
        const hasReckless = ridersOfTeam(screen.state.universe, team.id).some(r => r.traits.includes('reckless'));
        return (
          <PartsManager
            bikeSetup={team.bikeSetup}
            teamBudget={team.budget}
            hasRecklessRider={hasReckless}
            reliabilityRdLevel={1}
            crewQuality={team.coachQuality}
            baseEngineCost={45_000}
            onEngineModChange={mode => { team.bikeSetup.engineMode = mode; saveCareer(screen.state); }}
            onRebuild={componentType => {
              const c = team.bikeSetup.components[componentType];
              if (c) { c.wear = 0; c.lastRebuild = screen.state.round; team.budget -= 15_000; saveCareer(screen.state); }
            }}
            onClose={() => { saveCareer(screen.state); setScreen({ id: 'hub', state: screen.state }); }}
          />
        );
      })()}

      {screen.id === 'rdcenter' && (
        <RDCenter state={screen.state} onExit={() => { saveCareer(screen.state); setScreen({ id: 'hub', state: screen.state }); }} />
      )}

      {screen.id === 'offseason' && (
        <OffSeason state={screen.state} report={screen.report} onDone={() => { saveCareer(screen.state); setScreen({ id: 'hub', state: screen.state }); }} />
      )}

      {screen.id === 'placeholder' && (
        <Placeholder title={screen.title} note={screen.note} onBack={() => setScreen({ id: 'hub', state: screen.state })} />
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
