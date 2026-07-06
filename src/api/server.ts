// NAMC Backend API Server
// Serves game logic to UE5.7 frontend via REST + WebSocket

import express from 'express';
import type { Request, Response } from 'express';
import { gameManager } from '../game/index';
import { ENGINES } from '../data/bikes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS for UE5.7 client
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', version: '0.1.0', environment: 'namc-v15.1' });
});

// ============================================================================
// TEAM ENDPOINTS
// ============================================================================

app.post('/api/team/create', (req: Request, res: Response) => {
  try {
    const { ownerName, charterName } = req.body;
    if (!ownerName || !charterName) {
      return res.status(400).json({ error: 'ownerName and charterName required' });
    }
    const teamId = `team_${Date.now()}`;
    const team = gameManager.createTeam(teamId, ownerName);
    res.json({ teamId, charterName, owner: ownerName, budget: team.economy.getBudgetState() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/team/:teamId', (req: Request, res: Response) => {
  try {
    const team = gameManager.getTeam(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ id: team.id, owner: team.owner, budget: team.economy.getBudgetState() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/team/:teamId/budget', (req: Request, res: Response) => {
  // PUT /api/team/{teamId}/budget
  // Body: { allocation }
  // Returns: updated budget state
  res.status(501).json({ error: 'Not implemented' });
});

// ============================================================================
// SEASON ENDPOINTS
// ============================================================================

app.post('/api/season/start', (req: Request, res: Response) => {
  try {
    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });
    const season = gameManager.startSeason(teamId);
    res.json(season);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/season/:teamId/state', (req: Request, res: Response) => {
  // GET /api/season/{teamId}/state
  // Returns: current season progress, standings, budget
  res.status(501).json({ error: 'Not implemented' });
});

// ============================================================================
// ROUND / RACE ENDPOINTS
// ============================================================================

app.get('/api/race/:roundId', (req: Request, res: Response) => {
  // GET /api/race/{roundId}
  // Returns: track info, weather, setup options, entry list
  res.status(501).json({ error: 'Not implemented' });
});

app.post('/api/race/:roundId/setup', (req: Request, res: Response) => {
  // POST /api/race/{roundId}/setup
  // Body: { teamId, setupProfiles[] }
  // Returns: setup confirmation, cost breakdown
  res.status(501).json({ error: 'Not implemented' });
});

app.post('/api/race/:roundId/execute', (req: Request, res: Response) => {
  // POST /api/race/{roundId}/execute
  // Body: { teamId }
  // Returns: race results, purse payout, standings update
  // (WebSocket will stream live race data during execution)
  res.status(501).json({ error: 'Not implemented' });
});

app.get('/api/race/:roundId/results', (req: Request, res: Response) => {
  // GET /api/race/{roundId}/results
  // Returns: final results, purse, standings after race
  res.status(501).json({ error: 'Not implemented' });
});

// ============================================================================
// STANDINGS / PROGRESSION ENDPOINTS
// ============================================================================

app.get('/api/standings/:teamId', (req: Request, res: Response) => {
  // GET /api/standings/{teamId}
  // Returns: current championship standings
  res.status(501).json({ error: 'Not implemented' });
});

app.get('/api/standings/:teamId/budget', (req: Request, res: Response) => {
  // GET /api/standings/{teamId}/budget
  // Returns: team budget, cash flow, purse tracking
  res.status(501).json({ error: 'Not implemented' });
});

// ============================================================================
// R&D / UPGRADES ENDPOINTS
// ============================================================================

app.get('/api/rnd/:teamId/available', (req: Request, res: Response) => {
  // GET /api/rnd/{teamId}/available
  // Returns: available R&D upgrades (staff tier-gated)
  res.status(501).json({ error: 'Not implemented' });
});

app.post('/api/rnd/:teamId/unlock', (req: Request, res: Response) => {
  // POST /api/rnd/{teamId}/unlock
  // Body: { upgradeId, costAllocation }
  // Returns: unlock confirmation, new capabilities
  res.status(501).json({ error: 'Not implemented' });
});

// ============================================================================
// ENGINE BROWSER ENDPOINTS
// ============================================================================

app.get('/api/engines/list', (req: Request, res: Response) => {
  try {
    const engineList = Object.values(ENGINES).map(eng => ({
      engineId: eng.id,
      name: eng.name,
      manufacturer: eng.manufacturer,
      horsepower: eng.horsepower,
      weight: eng.weight,
      yearlyLeaseCost: eng.yearlyLeaseCost,
      description: eng.description,
      ovrBonus: eng.ovrBonus,
      classSpecificCosts: {
        '350-pro': eng.yearlyLeaseCost,
        '250': eng.yearlyLeaseCost,
        '250p': eng.id === 'restricted-450' ? 280000 : eng.yearlyLeaseCost * 0.7,
        'womens-250': eng.yearlyLeaseCost * 0.9,
      },
    }));
    res.json(engineList);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/engines/:engineId/detail', (req: Request, res: Response) => {
  try {
    const engine = ENGINES[req.params.engineId as any];
    if (!engine) return res.status(404).json({ error: 'Engine not found' });
    res.json({
      engineId: engine.id,
      name: engine.name,
      manufacturer: engine.manufacturer,
      horsepower: engine.horsepower,
      weight: engine.weight,
      reliability: engine.reliability,
      yearlyLeaseCost: engine.yearlyLeaseCost,
      baseLapTime: engine.baseLapTime,
      description: engine.description,
      ovrBonus: engine.ovrBonus,
      classSpecificCosts: {
        '350-pro': engine.yearlyLeaseCost,
        '250': engine.yearlyLeaseCost,
        '250p': engine.id === 'restricted-450' ? 280000 : engine.yearlyLeaseCost * 0.7,
        'womens-250': engine.yearlyLeaseCost * 0.9,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/team/:teamId/engines/add', (req: Request, res: Response) => {
  try {
    const { engineId, classSelections } = req.body;
    // classSelections: { '350-pro': 1, '250': 2, '250p': 0, 'womens-250': 1 }
    const team = gameManager.getTeam(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    let totalCost = 0;
    const engine = ENGINES[engineId as any];
    if (!engine) return res.status(400).json({ error: 'Engine not found' });

    for (const [cls, qty] of Object.entries(classSelections)) {
      if (qty > 0) {
        const classCost =
          cls === '250p'
            ? 280000
            : cls === 'womens-250'
              ? engine.yearlyLeaseCost * 0.9
              : engine.yearlyLeaseCost;
        totalCost += classCost * (qty as number);
      }
    }

    const budget = team.economy.getBudgetState();
    if (budget.remaining < totalCost) {
      return res.status(400).json({ error: 'Insufficient budget', required: totalCost, available: budget.remaining });
    }

    res.json({
      engineId,
      classSelections,
      totalCost,
      budgetRemaining: budget.remaining - totalCost,
      confirmed: true,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
  console.log(`🏍️ NAMC Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Season: 2027 (NAMC v15.1)`);
  console.log(`📡 WebSocket ready for real-time race streaming`);
});
