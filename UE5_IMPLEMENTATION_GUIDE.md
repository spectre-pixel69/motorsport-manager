# Paddock Boss — UE5.7 Implementation Guide

Complete checklist for building out the HubScreen and RaceView from C++ foundation to playable demo.

---

## Phase 1: Project Setup & Compilation ✓ DONE

- [x] Create PaddockBoss.uproject (UE 5.7)
- [x] Setup C++ module with plugin dependencies (CommonUI, GameplayAbilities)
- [x] Create GameData.h structures (team vitals, standings, feeds)
- [x] Implement GameAPIManager (HTTP client to TypeScript backend)
- [x] Implement HubScreenWidget (C++ UMG base class)
- [x] Implement RaceViewWidget (C++ UMG base class)
- [x] Setup PaddockBossGameMode (UI orchestration)
- [x] Create build configuration files (.Target.cs, .Build.cs)
- [x] Commit to git

**Status**: Ready to open in Unreal Engine 5.7

---

## Phase 2: Create Widget Blueprints

### HubScreen Widget Blueprint (WBP_HubScreen)

**Location**: `Content/UI/Screens/WBP_HubScreen`

**Parent Class**: UHubScreenWidget (C++)

**Designer Layout** (Canvas/Grid):

```
┌─────────────────────────────────────────────────────────┐
│ Header Panel (Dark Glass)                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏭 TeamNameText (size: 32pt, gold color)           │ │
│ │ SeasonInfoText (size: 14pt, muted gray)            │ │
│ └─────────────────────────────────────────────────────┘ │
├────────────────────────┬────────────────────────────────┤
│ LEFT PANEL (60%)       │ RIGHT PANEL (40%)              │
├────────────────────────┼────────────────────────────────┤
│                        │ RankPanel (Pulsing Gold)       │
│ TEAM VITALS           │ ┌──────────────────────────┐   │
│ ┌────────────────────┐ │ RankText (large, animated)│   │
│ │ Metric: Balance    │ │ of TotalTeams             │   │
│ │ BalanceText        │ │ └──────────────────────────┘   │
│ │ $$$k / 8% budget   │ │                                │
│ └────────────────────┘ │ TopRidersPanel (Scroll)       │
│                        │ ┌──────────────────────────┐   │
│ SeasonProgressBar      │ │ #1 Martinez 456 pts      │   │
│ Indicator: 8/20        │ │ #2 Chen 423 pts          │   │
│                        │ │ #3 Williams 401 pts      │   │
│ NEXT RACE             │ │ #4 Davis 378 pts         │   │
│ ┌────────────────────┐ │ │ #5 Taylor 356 pts        │   │
│ │ NextTrackText      │ │ └──────────────────────────┘   │
│ │ outdoor • location │ │                                │
│ │ [Go Racing] pulsing│ │ MANAGEMENT SHORTCUTS          │
│ └────────────────────┘ │ ┌──────────────────────────┐   │
│                        │ │ [🛒 Showroom]            │   │
│ MEDIA FEEDS           │ │ [🔧 Garage]              │   │
│ ┌────────────────────┐ │ │ [💪 Training]            │   │
│ │ Ryan's Briefing:   │ │ │ [🔬 R&D Center]          │   │
│ │ • SBK Transfer     │ │ │ [← Exit]                 │   │
│ │ • K. Yamaha injury │ │ └──────────────────────────┘   │
│ └────────────────────┘ │                                │
│                        │                                │
│ Track Days:            │                                │
│ ┌────────────────────┐ │                                │
│ │ • Engine +2.3 grip │ │                                │
│ │ • Setup breakthrough│ │                                │
│ └────────────────────┘ │                                │
└────────────────────────┴────────────────────────────────┘
```

**Canvas Structure**:
1. Header HBox (vertical alignment: top, padding: 16px)
   - TeamNameText (size: 32, weight: bold, color: gold)
   - SeasonInfoText (size: 14, color: muted gray)

2. MainHBox (horizontal layout, padding: 16px)
   - LeftPanel (60% width)
     - TeamVitalsPanel (vertical)
       - BalanceRow (metric + value)
       - PrestigeRow (metric + value)
       - ReliabilityRow (metric + value)
       - RDLevelRow (metric + value)
     - SeasonProgressBar (full width, height: 16px)
     - NextRacePanel (glass-morphism card)
       - NextTrackText (size: 18, bold)
       - NextRaceInfoText (size: 12, muted)
       - GoRacingButton (primary color, pulsing animation)
     - BriefingPanel (scroll, max height: 200px)
     - TrackDaysPanel (scroll, max height: 200px)

   - RightPanel (40% width)
     - RankPanel (glass-morphism card, top: 0)
       - RankText (size: 48, gold, pulsing)
       - RankSubText ("of 20 teams")
     - TopRidersPanel (scroll, border: gold)
       - Dynamic rider entries (RiderText widgets)
     - ManagementPanel (glass-morphism card)
       - ShowroomButton (width: 100%, height: 40px)
       - GarageButton (width: 100%, height: 40px)
       - TrainingButton (width: 100%, height: 40px)
       - RDCenterButton (width: 100%, height: 40px)
       - ExitButton (width: 100%, height: 40px, red accent)

**Styling**:
- Background: Canvas color `#0a0e27`
- Panel border color: `#2a3a5a`
- Text color primary: `#ffffff`
- Text color muted: `#8899aa`
- Accent gold: `#f39c12`
- Accent green: `#2ecc71`

**Animations** (Blueprint Graph):
1. On Construct:
   - Pane fade-in (0.3s, easing: ease-out)
   - Stagger team vitals (each metric slides in 0.1s apart)
   - Rank panel starts pulsing (2.5s cycle)
   - Top riders cascade reveal (each row +0.1s)

2. OnHubDataReceived:
   - Update text fields (smooth color transitions)
   - Reanimate metric glows
   - Bounce next race card

**Bindings**:
- BalanceText color → GetVitalColor(Balance)
- PrestigeText color → GetVitalColor(Prestige)
- ReliabilityText color → GetVitalColor(Reliability)
- SeasonProgressBar percent → SeasonProgress
- RankText text → Format(Rank, TotalTeams)
- TopRidersPanel → Loop TopRiders array, create RiderText widgets

---

### RaceView Widget Blueprint (WBP_RaceView)

**Location**: `Content/UI/Screens/WBP_RaceView`

**Parent Class**: URaceViewWidget (C++)

**Designer Layout** (Broadcast View):

```
┌─────────────────────────────────────────────────────────┐
│ RACE HEADER                                             │
│ Travis Peak • Montana • Round 8/20 • NAMC 350 Pro     │
└─────────────────────────────────────────────────────────┘
┌──────────────────────────────────┬─────────────────────┐
│ 3D RACE CAMERA VIEW              │ TELEMETRY PANEL    │
│ (Main render target or video)    │                    │
│                                  │ Lap 8 / 20         │
│                                  │                    │
│ (Bike models, track detail,      │ LEADER:            │
│  spectators, pit crews)          │ Martinez - +0.45s  │
│                                  │                    │
│                                  │ YOUR POSITION:     │
│                                  │ #4 - -12.2s        │
│                                  │                    │
│                                  │ STANDINGS:         │
│                                  │ 1. Martinez 100pt  │
│                                  │ 2. Chen 98pt       │
│                                  │ 3. Williams 96pt   │
│                                  │ 4. YOU 92pt        │
│                                  │ 5. Davis 88pt      │
└──────────────────────────────────┴─────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ [Return to Hub] ← Quit Button                           │
└──────────────────────────────────────────────────────────┘
```

**Canvas Structure**:
1. HeaderPanel (horizontal, full width, height: 40px, background: dark)
   - RaceHeaderText (size: 16, color: white)

2. MainHBox (horizontal, padding: 8px)
   - LeftPanel (80% width) — 3D render target or static image placeholder
   - RightPanel (20% width) — Telemetry scroll
     - LapCounterText (size: 24, bold)
     - LeaderNameText (size: 14)
     - LeaderDistanceText (size: 14, color: red if gap widening)
     - PlayerPositionText (size: 14)
     - PlayerTimeGapText (size: 14)
     - RaceResultsScroll (list of all race positions)

3. FooterPanel (horizontal, full width, height: 40px)
   - ReturnToHubButton (primary, centered)

**Styling**:
- Background: Canvas color `#0a0e27`
- Telemetry panel: Slightly lighter background `#1a2a4a`
- Leader gap color: Red `#e74c3c` if losing, green `#2ecc71` if gaining
- Text: White primary, gray muted

**Animation**:
1. On Construct:
   - Fade in from black (0.5s)
   - Slide telemetry panel from right (0.4s)

2. Every lap update:
   - Flash LapCounterText briefly
   - Update LeaderDistance color based on gap trend

**Bindings**:
- LapCounterText text → Format(CurrentLap, TotalLaps)
- LeaderDistanceText color → (gap < 0.5s) ? red : (gap > 2.0s) ? green : yellow
- RaceResultsList → Loop through standings array

---

## Phase 3: 3D Environment Setup

### HubLevel Map

**Location**: `Content/Maps/HubLevel`

**Actors**:
1. **Directional Light** (cinematic lighting)
   - Intensity: 1.2
   - Color: Cool daylight (slight blue tint)
   - Dynamic shadows enabled
   - Volumetric fog enabled

2. **Garage/HQ 3D Environment** (modular pieces)
   - Pit wall structure (wall-mounted screens, work benches)
   - Bike pedestals (3-4 bikes on display)
   - Sponsor boards (dynamic logos)
   - Lighting rigs (studio lights on garage ceiling)
   - Pit crew NPCs (standing/idle animations)

3. **Camera Rig** (cinematic camera)
   - Smooth pan across pit wall
   - Focus on center bike model
   - DOF effect on background (out-of-focus pit crews)
   - Post-process volume for color grading

4. **HubScreenWidget** (UI overlay)
   - Canvas scaler: 1920x1080 reference
   - Depth: 0 (render on top)
   - Attached to player camera, offset 50-100 units

### RaceLevel Map

**Location**: `Content/Maps/RaceLevel`

**Actors**:
1. **Track Environment** (modular terrain)
   - Dirt surface (material with dust particles)
   - Barriers, curbing, hazard markers
   - Spectator stands (partially modeled or billboard)
   - Pit lane with crew animations

2. **Dynamic Cameras**
   - Main broadcast camera (fixed track-side position)
   - Helicopter camera (sweeping overhead shots)
   - Pit camera (focused on pit boxes)
   - Driver onboard camera (from bike POV)

3. **Bike Models** (with physics)
   - Skeletal meshes for each rider
   - Material instances for team colors + sponsor decals
   - Suspension/wheel animations (IK rig)
   - Dust trail particle effect

4. **Pit Crew NPCs** (animated)
   - Crew members in proper positions
   - Idle/working animations
   - Response animations (celebration/frustration)

5. **RaceViewWidget** (UI overlay)
   - Anchored to top-right corner
   - 25% of screen width for telemetry
   - Semi-transparent background (allow 3D to show through)

---

## Phase 4: Integration

### Backend API Routes (TypeScript)

**Verify these exist in `/api` routes:**

```typescript
// GET /api/hub
// Returns: FHubScreenData (team vitals, standings, next race, feeds)

// GET /api/race/broadcast
// Returns: Race telemetry (lap count, leaderboard, live gaps)

// POST /api/race/start
// Input: { trackId, round }
// Returns: { raceStarted: true, trackId, round }
```

**Missing routes to implement:**
- `GET /api/race/standings` — Live leaderboard per lap
- `GET /api/race/telemetry/:riderId` — Individual rider data
- `GET /api/media/briefing` — Ryan's latest updates
- `GET /api/media/trackdays` — Dustin's technical notes

---

## Phase 5: Debugging & Polish

### Common Compilation Issues

**"HubScreenWidget has unresolved external symbol"**
- Ensure `#include "UI/HubScreenWidget.h"` in .cpp files
- Check module .Build.cs includes all dependencies
- Rebuild solution: `Ctrl+Alt+F11` in Visual Studio

**"Cannot find HTTP module"**
- Verify .Build.cs has `"HTTP"` in PublicDependencyModuleNames
- Regenerate project files: Right-click .uproject → Generate Visual Studio project files

**"APIManager not spawning"**
- Ensure PaddockBossGameMode is set as default in level (World Settings)
- Check output log for "APIManager spawned" message

### Testing Checklist

1. **API Connection**
   - [ ] Backend running on localhost:3001
   - [ ] HubScreenWidget::RefreshHubData() makes GET /api/hub request
   - [ ] Response parsed into FHubScreenData
   - [ ] OnHubDataLoaded delegate fired with data

2. **UI Display**
   - [ ] All text fields populated correctly
   - [ ] Colors applied based on vital values
   - [ ] Rank text pulsing smoothly
   - [ ] Season progress bar reflects state

3. **Button Interactivity**
   - [ ] "Go Racing" → OnGoRacingClicked → StartRace() → POST /api/race/start
   - [ ] "Showroom" → Log message (future: load showroom screen)
   - [ ] "Exit" → Log message (future: return to main menu)

4. **Performance**
   - [ ] HTTP requests don't block main thread
   - [ ] Frame rate stable 60 FPS on target hardware
   - [ ] Memory usage < 500MB idle

---

## Phase 6: Feature Expansion

### Broadcast Integration (Task #19)

Link lip-synced video overlays:
1. Ryan's voice-over (`.wav` files) + video cutins (`.mp4` files)
2. Dustin's track-side commentary during races
3. Transition animations between feed sources

**Requires**:
- Media player component (UMediaPlayer)
- Audio mixer (for mix between game audio + commentary)
- Video codec support (check UE5 media framework)

### Save/Load Integration

Persist HubScreenData to backend:
1. Career state saved automatically per round
2. Player customizations (favorite camera angle, UI theme)
3. Achievements/trophies earned

---

## Deliverable Timeline

| Phase | Est. Time | Owner | Status |
|-------|-----------|-------|--------|
| Phase 1: Setup | 2h | Claude | ✓ Done |
| Phase 2: Blueprints | 4h | Manual (UE5 Designer) | ⏳ Next |
| Phase 3: 3D Environments | 8h | 3D Artist (future) | Pending |
| Phase 4: API Integration | 2h | Claude | Pending |
| Phase 5: Debug & Polish | 2h | QA Testing | Pending |
| Phase 6: Broadcast System | 4h | Audio/Video Team | Pending |

**Total: ~22 hours to playable demo**

---

## Quick Start (From Here)

1. **Open UE5 Editor:**
   ```bash
   cd /home/user/motorsport-manager/PaddockBoss-UE5
   /path/to/UE5.7/Engine/Binaries/Linux/UnrealEditor "PaddockBoss.uproject"
   ```

2. **Wait for project to compile** (first time: 5-10 min)

3. **Create widget blueprints:**
   - Right-click in Content Browser → Widget Blueprint → Select UHubScreenWidget
   - Name it `WBP_HubScreen`
   - Follow Designer layout above

4. **Setup level:**
   - File → New Level → Empty Level
   - Save as `Content/Maps/HubLevel`
   - Place actor → Search "PaddockBossGameMode" → Drag into level
   - In Mode properties, set HubScreenClass to WBP_HubScreen

5. **Play:**
   - Click Play button
   - Widget appears on screen
   - API calls start when backend is running

---

**Next Message**: Share the IGP Manager race UI screenshots you want recreated. I'll create the RaceLevel layout and camera rig accordingly.
