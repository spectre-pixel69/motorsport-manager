// NAMC Backend API Server
// Serves game logic to UE5.7 frontend via REST + WebSocket

import express from 'express';
import type { Request, Response } from 'express';
import { gameManager } from '../game/index';

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
