// Hub Screen — main game hub with 3 discipline bikes + navigation
// Layout: showroom (3 bikes) + overlay UI panel + bottom nav
// Mirrors Motorsport Manager reference design

import { useState } from 'preact/hooks';
import type { CareerState } from '../game/state';
import { Logo } from './Logo';
import './hub.css';

interface Props {
  careerState: CareerState | null;
  onContinueCareer: () => void;
  onNewCareer: () => void;
  onOpenDashboard: () => void;
  onOpenStore: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboards: () => void;
  onOpenSettings: () => void;
}

export function HubScreen({
  careerState,
  onContinueCareer,
  onNewCareer,
  onOpenDashboard,
  onOpenStore,
  onOpenGarage,
  onOpenLeaderboards,
  onOpenSettings,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bikes' | 'team'>('overview');

  return (
    <div class="hub-screen">
      {/* Background Showroom */}
      <div class="hub-background">
        <div class="showroom-gradient" />
      </div>

      {/* Bike Display Area */}
      <div class="bikes-showcase">
        <div class="bike-display supergp">
          <div class="bike-label">SuperGP</div>
          <div class="bike-icon">🏍️</div>
        </div>
        <div class="bike-display superbike">
          <div class="bike-label">Superbike</div>
          <div class="bike-icon">🏎️</div>
        </div>
        <div class="bike-display namc">
          <div class="bike-label">NAMC</div>
          <div class="bike-icon">🏁</div>
        </div>
      </div>

      {/* Main UI Panel */}
      <div class="hub-panel">
        {/* Header */}
        <div class="hub-header">
          <div class="logo-badge">
            <div class="p3-mark">P3</div>
          </div>
          <div class="hub-title">
            <h1>PADDOCK BOSS</h1>
            <div class="tagline">BUILD. MANAGE. RACE. WIN.</div>
          </div>
        </div>

        {/* Career Info */}
        {careerState && (
          <div class="career-info">
            <div class="team-display">
              <div class="team-logo">
                <Logo spec={careerState.universe.teams[careerState.playerTeamId].logo} size={48} />
              </div>
              <div class="team-details">
                <div class="team-name">
                  {careerState.universe.teams[careerState.playerTeamId].name}
                </div>
                <div class="season-info">
                  Season {careerState.season} • Round {careerState.round + 1}
                </div>
              </div>
            </div>
            <div class="team-stats">
              <div class="stat">
                <span class="label">Budget</span>
                <span class="value">
                  ${Math.round(careerState.universe.teams[careerState.playerTeamId].budget).toLocaleString()}
                </span>
              </div>
              <div class="stat">
                <span class="label">Prestige</span>
                <span class="value">
                  {Math.round(careerState.universe.teams[careerState.playerTeamId].prestige)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div class="action-buttons">
          {careerState ? (
            <button class="btn-action btn-continue" onClick={onContinueCareer}>
              ▶ CONTINUE CAREER
            </button>
          ) : (
            <div class="no-career">No active career</div>
          )}
          <button class="btn-action btn-new" onClick={onNewCareer}>
            + NEW CAREER
          </button>
        </div>

        {/* Tab Navigation */}
        <div class="tab-bar">
          <button
            class={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            class={`tab ${activeTab === 'bikes' ? 'active' : ''}`}
            onClick={() => setActiveTab('bikes')}
          >
            🏍️ Bikes
          </button>
          <button
            class={`tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            👥 Team
          </button>
        </div>

        {/* Tab Content */}
        <div class="tab-content">
          {activeTab === 'overview' && careerState && (
            <div class="overview-content">
              <div class="stat-row">
                <span class="label">Championship</span>
                <span class="value">{careerState.championship}</span>
              </div>
              <div class="stat-row">
                <span class="label">Discipline</span>
                <span class="value">{careerState.discipline.toUpperCase()}</span>
              </div>
              <div class="stat-row">
                <span class="label">Focus Class</span>
                <span class="value">{careerState.focusClass}</span>
              </div>
            </div>
          )}

          {activeTab === 'bikes' && (
            <div class="bikes-content">
              <div class="bike-info">
                <p>Manage bike setup, components, and reliability in the Garage.</p>
              </div>
            </div>
          )}

          {activeTab === 'team' && careerState && (
            <div class="team-content">
              <div class="roster-count">
                {Object.values(careerState.universe.riders)
                  .filter(r => r.teamId === careerState.playerTeamId && !r.bench)
                  .length}{' '}
                Starters • 3 Bench
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div class="hub-navbar">
        <button class="nav-btn" onClick={onOpenDashboard} title="Team Dashboard">
          <span class="nav-icon">📋</span>
          <span class="nav-label">Dashboard</span>
        </button>
        <button class="nav-btn" onClick={onOpenStore} title="Shop for Parts & Riders">
          <span class="nav-icon">🛍️</span>
          <span class="nav-label">Store</span>
        </button>
        <button class="nav-btn" onClick={onOpenGarage} title="Garage & Parts">
          <span class="nav-icon">🔧</span>
          <span class="nav-label">Garage</span>
        </button>
        <button class="nav-btn" onClick={onOpenLeaderboards} title="Championship Standings">
          <span class="nav-icon">🏆</span>
          <span class="nav-label">Leaderboards</span>
        </button>
        <button class="nav-btn" onClick={onOpenSettings} title="Settings">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">Settings</span>
        </button>
      </div>
    </div>
  );
}
