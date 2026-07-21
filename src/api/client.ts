// API Client - Calls to Express backend for team operations

// Default to localhost (can be overridden via Vite environment variables)
const API_BASE = 'http://localhost:3000/api';

export interface TeamUpdateResponse {
  success: boolean;
  teamId: string;
  message?: string;
  error?: string;
}

export interface DraftRiderRequest {
  riderId: string;
  classId: string;
}

export interface SignFreeAgentRequest {
  riderId: string;
  classId: string;
  salary: number;
}

// Team operations
export async function draftRider(
  teamId: string,
  riderId: string,
  classId: string
): Promise<TeamUpdateResponse> {
  try {
    const response = await fetch(`${API_BASE}/team/${teamId}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riderId, classId } as DraftRiderRequest),
    });
    return response.json();
  } catch (error) {
    return {
      success: false,
      teamId,
      error: String(error),
    };
  }
}

export async function signFreeAgent(
  teamId: string,
  riderId: string,
  classId: string,
  salary: number
): Promise<TeamUpdateResponse> {
  try {
    const response = await fetch(`${API_BASE}/team/${teamId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riderId, classId, salary } as SignFreeAgentRequest),
    });
    return response.json();
  } catch (error) {
    return {
      success: false,
      teamId,
      error: String(error),
    };
  }
}

// Rider data
export async function getAvailableRiders() {
  try {
    const response = await fetch(`${API_BASE}/riders/available`);
    return response.json();
  } catch (error) {
    return [];
  }
}

export async function getRiderDetails(riderId: string) {
  try {
    const response = await fetch(`${API_BASE}/riders/${riderId}`);
    return response.json();
  } catch (error) {
    return null;
  }
}

// Team standings
export async function getTeamStandings(teamId: string, classId: string) {
  try {
    const response = await fetch(`${API_BASE}/team/${teamId}/standings/${classId}`);
    return response.json();
  } catch (error) {
    return { standings: [], budget: 0 };
  }
}

// Season info
export async function getSeasonCalendar(season: number) {
  try {
    const response = await fetch(`${API_BASE}/season/${season}/calendar`);
    return response.json();
  } catch (error) {
    return [];
  }
}
