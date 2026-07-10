// NAMC Backend API Server
// Serves game logic to UE5.7 frontend via REST + WebSocket

import express from 'express';
import type { Request, Response } from 'express';
import { gameManager } from '../game/index';
import { ENGINES, CHASSIS, TIRES } from '../data/bikes';
import { ALL_STAFF } from '../data/staff';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS for UE5.7 client
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
    const team = gameManager.getTeam(req.params.teamId as string);
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
    const engineId = req.params.engineId as any;
    const engine: any = ENGINES[engineId];
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
    const { engineId, classSelections } = req.body as { engineId: string; classSelections: Record<string, unknown> };
    // classSelections: { '350-pro': 1, '250': 2, '250p': 0, 'womens-250': 1 }
    const team = gameManager.getTeam(req.params.teamId as string);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    let totalCost = 0;
    const engine: any = ENGINES[engineId as any];
    if (!engine) return res.status(400).json({ error: 'Engine not found' });

    for (const [cls, qty] of Object.entries(classSelections)) {
      const qtyNum = typeof qty === 'number' ? qty : Number(qty);
      if (qtyNum > 0) {
        const classCost =
          cls === '250p'
            ? 280000
            : cls === 'womens-250'
              ? engine.yearlyLeaseCost * 0.9
              : engine.yearlyLeaseCost;
        totalCost += classCost * qtyNum;
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

// ============================================================================
// CHASSIS SHOWROOM ENDPOINTS
// ============================================================================

app.get('/api/chassis/list', (req: Request, res: Response) => {
  try {
    // CHASSIS already imported
    const chassisList = Object.values(CHASSIS).map((ch: any) => ({
      chassisId: ch.id,
      name: ch.name,
      manufacturer: ch.manufacturer,
      weight: ch.weight,
      rigidity: ch.rigidity,
      yearlyLeaseCost: ch.yearlyLeaseCost,
      description: ch.description,
      strengths: ch.strengths,
      weaknesses: ch.weaknesses,
      ovrBonus: ch.ovrBonus,
      classSpecificCosts: {
        '350-pro': ch.yearlyLeaseCost,
        '250': ch.yearlyLeaseCost,
        '250p': ch.yearlyLeaseCost * 0.9,
        'womens-250': ch.yearlyLeaseCost * 0.9,
      },
    }));
    res.json(chassisList);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/chassis/:chassisId/detail', (req: Request, res: Response) => {
  try {
    // CHASSIS already imported
    const chassisId = req.params.chassisId as any;
    const chassis: any = CHASSIS[chassisId];
    if (!chassis) return res.status(404).json({ error: 'Chassis not found' });
    res.json({
      chassisId: chassis.id,
      name: chassis.name,
      manufacturer: chassis.manufacturer,
      weight: chassis.weight,
      rigidity: chassis.rigidity,
      yearlyLeaseCost: chassis.yearlyLeaseCost,
      description: chassis.description,
      strengths: chassis.strengths,
      weaknesses: chassis.weaknesses,
      ovrBonus: chassis.ovrBonus,
      compatibleEngines: chassis.compatibleEngines,
      classSpecificCosts: {
        '350-pro': chassis.yearlyLeaseCost,
        '250': chassis.yearlyLeaseCost,
        '250p': chassis.yearlyLeaseCost * 0.9,
        'womens-250': chassis.yearlyLeaseCost * 0.9,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/team/:teamId/chassis/add', (req: Request, res: Response) => {
  try {
    const { chassisId, classSelections } = req.body as { chassisId: string; classSelections: Record<string, unknown> };
    const team = gameManager.getTeam(req.params.teamId as string);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // CHASSIS already imported
    const chassis: any = CHASSIS[chassisId as any];
    if (!chassis) return res.status(400).json({ error: 'Chassis not found' });

    let totalCost = 0;
    for (const [cls, qty] of Object.entries(classSelections)) {
      const qtyNum = typeof qty === 'number' ? qty : Number(qty);
      if (qtyNum > 0) {
        const classCost = ['250p', 'womens-250'].includes(cls) ? chassis.yearlyLeaseCost * 0.9 : chassis.yearlyLeaseCost;
        totalCost += classCost * qtyNum;
      }
    }

    const budget = team.economy.getBudgetState();
    if (budget.remaining < totalCost) {
      return res.status(400).json({ error: 'Insufficient budget', required: totalCost, available: budget.remaining });
    }

    res.json({ chassisId, classSelections, totalCost, budgetRemaining: budget.remaining - totalCost, confirmed: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// TIRES SHOWROOM ENDPOINTS
// ============================================================================

app.get('/api/tires/list', (req: Request, res: Response) => {
  try {
    // TIRES already imported
    const tiresList = Object.values(TIRES).map((tire: any) => ({
      tireId: tire.id,
      name: tire.name,
      manufacturer: tire.manufacturer,
      gripRating: tire.gripRating,
      wearRate: tire.wearRate,
      costPerSet: tire.costPerSet,
      description: tire.description,
      strengths: tire.strengths,
      weaknesses: tire.weaknesses,
      ovrBonus: tire.ovrBonus,
      bestForSurface: tire.bestForSurface,
      seasonalCost: tire.costPerSet * 20,
    }));
    res.json(tiresList);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tires/:tireId/detail', (req: Request, res: Response) => {
  try {
    // TIRES already imported
    const tireId = req.params.tireId as any;
    const tire: any = TIRES[tireId];
    if (!tire) return res.status(404).json({ error: 'Tire not found' });
    res.json({
      tireId: tire.id,
      name: tire.name,
      manufacturer: tire.manufacturer,
      gripRating: tire.gripRating,
      wearRate: tire.wearRate,
      durability: tire.durability,
      costPerSet: tire.costPerSet,
      seasonalCost: tire.costPerSet * 20,
      description: tire.description,
      strengths: tire.strengths,
      weaknesses: tire.weaknesses,
      ovrBonus: tire.ovrBonus,
      bestForSurface: tire.bestForSurface,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// STAFF HIRING ENDPOINTS
// ============================================================================

app.get('/api/staff/list', (req: Request, res: Response) => {
  try {
    // ALL_STAFF already imported
    const staffList = Object.values(ALL_STAFF).map((staff: any) => ({
      staffId: staff.id,
      name: staff.name,
      role: staff.role,
      experience: staff.experience,
      salary: staff.salary,
      specialties: staff.specialties,
      rdUnlockTier: staff.rdUnlockTier,
      description: staff.description,
      ovrBonus: staff.ovrBonus,
    }));
    res.json(staffList);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/staff/:staffId/detail', (req: Request, res: Response) => {
  try {
    // ALL_STAFF already imported
    const staff = ALL_STAFF[req.params.staffId as any];
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    res.json({
      staffId: staff.id,
      name: staff.name,
      role: staff.role,
      experience: staff.experience,
      salary: staff.salary,
      specialties: staff.specialties,
      rdUnlockTier: staff.rdUnlockTier,
      maxBonusTier: staff.maxBonusTier,
      description: staff.description,
      ovrBonus: staff.ovrBonus,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/team/:teamId/staff/hire', (req: Request, res: Response) => {
  try {
    const { staffIds } = req.body; // Array of staff IDs to hire
    const team = gameManager.getTeam(req.params.teamId as string);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // ALL_STAFF already imported
    let totalCost = 0;

    for (const staffId of staffIds) {
      const staff = ALL_STAFF[staffId as any];
      if (!staff) return res.status(400).json({ error: `Staff ${staffId} not found` });
      totalCost += staff.salary;
    }

    const budget = team.economy.getBudgetState();
    if (budget.remaining < totalCost) {
      return res.status(400).json({ error: 'Insufficient budget', required: totalCost, available: budget.remaining });
    }

    res.json({ staffIds, totalCost, budgetRemaining: budget.remaining - totalCost, confirmed: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

