# Paddock Boss — UE5.8 Client

Professional motorsport manager game built with Unreal Engine 5.8 + TypeScript backend.

## Quick Start (no Blueprint setup required)

1. Install UE 5.8 from the Epic Launcher (Templates, Engine Source, MetaHuman Core Data, Android target).
2. Install Visual Studio 2022 with the **Game development with C++** workload.
3. Pull this repo, right-click `PaddockBoss.uproject` → **Generate Visual Studio project files**.
4. Open the generated `.sln`, build `PaddockBossEditor` (Development Editor | Win64), or just
   double-click the `.uproject` and let the editor compile the module.
5. New empty level → World Settings → GameMode Override = `PaddockBossGameMode` → **Play**.

`PaddockBossGameMode` spawns everything natively: the white showroom stage with display
platform, lights, camera, and the reference hub UI (`UBossHubWidget`) — top money bar
(BALANCE / INFLUENCE / NET SPEND), team logo roundel, SETUP/STAFF/CALENDAR/FINANCE rail,
TEAM STANDINGS / DRIVER STANDINGS, track map, and PROCEED. The layout matches the
reference art in `../art/reference/`. The bike on the platform is a basic-shape
placeholder — swap it for the real bike asset and photoreal showroom set on the
workstation; keep `AShowroomStage` as the camera rig.

## Project Structure

```
Source/
├── PaddockBoss/                    # Main module
│   ├── Public/
│   │   ├── PaddockBoss.h          # Module header
│   │   ├── GameData.h             # Data structures (team vitals, standings, etc.)
│   │   ├── GameAPIManager.h       # Backend API communication
│   │   ├── PaddockBossGameMode.h  # Game mode + UI orchestration
│   │   └── UI/
│   │       └── HubScreenWidget.h  # Main hub screen widget
│   └── Private/
│       ├── PaddockBoss.cpp        # Module implementation
│       ├── GameAPIManager.cpp     # API HTTP communication
│       ├── PaddockBossGameMode.cpp
│       └── UI/
│           └── HubScreenWidget.cpp
├── PaddockBoss.Target.cs          # Game target rules
└── PaddockBossEditor.Target.cs    # Editor target rules
```

## Building

### Prerequisites
- Unreal Engine 5.7 installed
- Visual Studio 2022 (Windows) or Xcode (Mac)
- C++ project templates enabled

### Build Steps

1. **Generate Visual Studio project:**
   ```bash
   cd /home/user/PaddockBoss-UE5
   /path/to/UE5/Engine/Build/BatchFiles/Linux/GenerateProjectFiles.sh PaddockBoss.uproject
   ```

2. **Compile from command line:**
   ```bash
   /path/to/UE5/Engine/Build/BatchFiles/Linux/Build.sh PaddockBossEditor Linux Development
   ```

3. **Or open in editor:**
   - Right-click `PaddockBoss.uproject` → "Open with Unreal Engine"
   - Select UE 5.7 from the list
   - Wait for editor to compile modules

## Runtime

### Backend Requirements
The UE5 client expects a running TypeScript backend on `http://localhost:3001`:

```bash
cd /home/user/motorsport-manager
npm run dev
```

Backend API endpoints:
- `GET /api/hub` — Load hub screen data (team vitals, standings, next race)
- `POST /api/race/start` — Initiate race simulation

### Running the Game

1. **In Editor:**
   - Open Level: `Content/Maps/HubLevel` (or create new)
   - Set `PaddockBossGameMode` as default game mode
   - Click "Play"

2. **Packaged Executable:**
   ```bash
   # After packaging for Windows/Linux/Mac
   ./PaddockBoss/Binaries/Linux/PaddockBoss -game
   ```

## Architecture

### Data Flow

```
TypeScript Backend          UE5 Client (Widget)
     ↓                            ↓
  Express API    ←→    GameAPIManager (HTTP)
  (game state)              ↓
                    HubScreenWidget
                    (display + interaction)
```

### Widget Lifecycle

1. **APaddockBossGameMode::BeginPlay** → Spawns AGameAPIManager
2. **GameMode::ShowHubScreen** → Creates UHubScreenWidget
3. **UHubScreenWidget::NativeConstruct** → Binds callbacks, calls RefreshHubData()
4. **GameAPIManager::LoadHubScreenData** → HTTP GET /api/hub
5. **OnHubDataLoaded** → UHubScreenWidget receives data, updates visuals

### Components

#### **GameData.h**
Data structures for:
- FTeamVitals (balance, prestige, reliability, R&D level)
- FRiderStanding (championship leaderboard entry)
- FNextRace (upcoming event details)
- FMediaFeed (news items from Ryan/Dustin)
- FHubScreenData (complete hub state)

#### **GameAPIManager**
HTTP client for backend communication:
- Implements FOnHubDataLoaded delegate
- Implements FOnRaceStarted delegate
- Handles JSON serialization/deserialization
- Configurable backend URL

#### **HubScreenWidget**
UMG widget displaying:
- Team name + season info
- Team vitals (color-coded metrics)
- Rank display (pulsing gold effect)
- Season progress bar
- Next race card with "Go Racing" button
- Top 5 riders standings
- Ryan's Briefing feed
- Track Days (Dustin) technical feed
- Management shortcuts (Showroom, Garage, Training, R&D)

## Design System

**Color Palette:**
- Background: `#0a0e27`
- Primary Panel: `#15192e`
- Secondary Panel: `#1a1f3a`
- Accent Green: `#2ecc71`
- Accent Blue: `#3498db`
- Accent Red: `#e74c3c`
- Accent Gold: `#f39c12`

**Animations:**
- Team Rank: Pulsing gold glow (2.5s cycle)
- Vital Metrics: Independent color glows on data arrival
- Buttons: Subtle lift on hover
- Panels: Glass-morphism with backdrop blur

## Debugging

### Logs
Widget logs appear in UE5 Output Log (Window → Developer Tools → Output Log):
- `[LogTemp]` prefix for all messages
- API connection status
- Data parsing results
- Button click events

### Common Issues

**"Failed to connect to backend"**
- Verify backend is running on localhost:3001
- Check network policy in remote environment
- Use `curl http://localhost:3001/api/hub` to verify

**"HubScreenClass is not set!"**
- In Editor, select Level Blueprint
- Find PaddockBossGameMode actor
- Set HubScreenClass to your widget blueprint

**Widget not showing**
- Ensure PaddockBossGameMode is default for the level
- Check that PlayerController exists
- Verify UHubScreenWidget is compiled without errors

## Next Steps

1. **Create Widget Blueprint:**
   - Create WBP_HubScreen from UHubScreenWidget
   - Designer: Layout panels using Canvas/Grid
   - Graph: Add animations (pulsing, fade-ins)
   - Set in GameMode HubScreenClass

2. **Add Race View Widget:**
   - Create URaceViewWidget (mirrors broadcast interface)
   - Displays live race telemetry, standings, pit radio
   - Wired to /api/race/broadcast endpoint

3. **Polish & Cinematic:**
   - 3D garage environment (camera pans)
   - Lighting effects on vital metrics
   - Smooth transitions between screens
   - Voice-over integration (Ryan/Dustin VO files)

## Integration with Backend

### API Contract

**GET /api/hub** — Hub Screen Data
```json
{
  "teamName": "Red Racing",
  "season": "Season 2027",
  "rank": 3,
  "totalTeams": 20,
  "teamVitals": {
    "balance": 180000,
    "prestige": 75,
    "reliability": 82.5,
    "rdLevel": 3
  },
  "seasonProgress": 0.4,
  "nextRace": {
    "trackName": "Travis Peak",
    "location": "Montana",
    "discipline": "Outdoor",
    "round": 8,
    "totalRounds": 20
  },
  "topRiders": [
    { "riderName": "Martinez", "points": 456, "position": 1, "bIsPlayerRider": false },
    ...
  ],
  "ryansBriefing": [
    { "title": "SBK Transfer Rumor", "content": "...", "author": "Ryan", "impact": 0.8 }
  ],
  "trackDays": [
    { "title": "Engine Optimization", "content": "+2.3 kg grip", "author": "Dustin", "impact": 0.6 }
  ]
}
```

**POST /api/race/start**
```json
{ "raceStarted": true, "trackId": "travis-peak", "round": 8 }
```

---

**Status**: UE5 project structure complete, C++ classes compiled, ready for widget blueprint design.  
**Last Updated**: 2026-07-17  
**Engine**: Unreal Engine 5.7
