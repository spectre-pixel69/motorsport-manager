// Main game manager: orchestrates teams, seasons, races
import { EconomyManager } from './economy';

export class GameManager {
  private teams: Map<string, any> = new Map();
  private seasons: Map<string, any> = new Map();

  createTeam(teamId: string, ownerName: string) {
    const economy = new EconomyManager(2027);
    this.teams.set(teamId, {
      id: teamId,
      owner: ownerName,
      economy,
      created: new Date(),
    });
    return this.teams.get(teamId);
  }

  getTeam(teamId: string) {
    return this.teams.get(teamId);
  }

  startSeason(teamId: string) {
    const team = this.getTeam(teamId);
    if (!team) throw new Error(`Team ${teamId} not found`);
    return { teamId, season: 2027, roundsRemaining: 20, budget: team.economy.getBudgetState() };
  }
}

export const gameManager = new GameManager();
