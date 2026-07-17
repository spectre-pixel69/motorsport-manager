# Paddock Boss — Quick Start (Open in UE5.7 Locally)

## On Your Machine (Windows/Mac/Linux)

### Prerequisites
- Unreal Engine 5.7 installed (from Epic Launcher)
- 20GB+ free disk space (project + compiled binaries)
- Visual Studio 2022 (Windows) or Xcode (Mac)

### Step 1: Clone & Navigate
```bash
cd /path/to/motorsport-manager
cd PaddockBoss-UE5
```

### Step 2: Generate Project Files
```bash
# Windows
right-click PaddockBoss.uproject → Generate Visual Studio project files

# Mac/Linux
/path/to/UE5/Engine/Build/BatchFiles/GenerateProjectFiles.sh PaddockBoss.uproject
```

### Step 3: Open in Editor
```bash
# Option A: Direct open (easiest)
right-click PaddockBoss.uproject → Open with Unreal Engine 5.7

# Option B: Command line
/path/to/UE5/Engine/Binaries/Win64/UnrealEditor.exe PaddockBoss.uproject
```

Wait for ~5-10 minutes on first load (compiles C++ modules).

### Step 4: Verify Backend is Running
In a separate terminal, from `motorsport-manager/` root:
```bash
npm run api
# Should print: 🏍️ NAMC Backend API running on http://localhost:3000
```

### Step 5: Create Hub Level
1. **In UE5 Editor**:
   - File → New Level → Empty Level
   - Save as: `Content/Maps/HubLevel`
   - World Settings (bottom right) → Set Game Mode to `PaddockBossGameMode`

2. **Place the Game Mode**:
   - Place Actor → Search "PaddockBossGameMode" → Drag into level
   
3. **Configure the Game Mode**:
   - Select PaddockBossGameMode in outliner
   - In Details panel → Search "HubScreenClass"
   - Click dropdown → Search "WBP_HubScreen" (if blueprint exists, select it)
   - Or leave as default for now (we'll create the blueprint next)

### Step 6: Create HubScreen Widget Blueprint
1. **Content Browser**:
   - Right-click → User Interface → Widget Blueprint
   - Parent Class: Select `HubScreenWidget` (from C++)
   - Name: `WBP_HubScreen`
   - Click Create

2. **Designer Tab** (visual layout):
   - Add Canvas Panel as root
   - Add the layout structure from `UE5_IMPLEMENTATION_GUIDE.md` section "HubScreen Widget Blueprint"
   - Add TextBlocks, Buttons, ProgressBar, ScrollBoxes per the guide

3. **Graph Tab** (logic):
   - No additional code needed (C++ handles everything)
   - Just bind button events to their click handlers

### Step 7: Play!
1. Open `Content/Maps/HubLevel`
2. Click "Play" (top toolbar)
3. Widget appears on screen
4. API requests fire automatically
5. Team data loads from `http://localhost:3000/api/hub`

---

## What You Should See

**On Screen**:
- Team name "Red Racing" (top left, gold text)
- Season info "Season 2027 • Round 8/20 • NAMC"
- Team vitals: Balance $180k, Prestige 75, Reliability 82.5%, R&D Lv.3
- Rank pulsing: "3 of 20 teams" (right panel)
- Next race: "Travis Peak • Montana"
- "Go Racing" button (pulsing red)
- Top 5 riders: Martinez, Chen, Williams, Davis, Taylor
- Ryan's Briefing: Transfer rumors, injury updates
- Track Days: Engine + setup notes from Dustin
- Management buttons: Showroom, Garage, Training, R&D Center

**In Output Log** (Window → Developer Tools → Output Log):
```
[LogTemp] GameAPIManager initialized at http://localhost:3000
[LogTemp] Requesting hub data from: http://localhost:3000/api/hub
[LogTemp] Hub API Response Code: 200
[LogTemp] Hub API Response: { ... }
```

---

## Troubleshooting

### "HubScreenClass is not set!"
- Select the PaddockBossGameMode actor in the level
- In Details panel, find "HubScreenClass"
- Click dropdown → Select WBP_HubScreen

### "Failed to connect to backend"
- Verify backend is running: `npm run api`
- Check it's on port 3000: `curl http://localhost:3000/api/hub`
- In GameAPIManager details, verify BackendURL = `http://localhost:3000`

### "Widget doesn't appear"
- Check Output Log for errors
- Ensure PlayerController exists in level
- Try setting widget Z-order higher (Details → Depth)

### C++ Compilation Errors
- Close editor
- Delete `Binaries/`, `Intermediate/`, `Saved/` folders
- Right-click .uproject → Generate Visual Studio project files
- Rebuild solution in Visual Studio
- Reopen UE5

---

## Next: Create Widget Blueprint Layout

Follow the Designer layout from `UE5_IMPLEMENTATION_GUIDE.md` "HubScreen Widget Blueprint" section.

Key components to add:
1. **Header Panel** (TeamNameText, SeasonInfoText)
2. **Left Panel** (Team Vitals, Progress Bar, Next Race Card, Media Feeds)
3. **Right Panel** (Rank Display pulsing, Top Riders Scroll, Management Buttons)

Don't hardcode values — they all bind to the C++ code via `CurrentHubData`.

---

**Estimated time**: 30 min to full playable HubScreen with live backend data  
**Questions?** Check Output Log for API debug messages
