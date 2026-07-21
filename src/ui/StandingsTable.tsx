// Reusable rider standings table component

import type { Rider, Team } from '../data/types';

interface StandingRow {
  rider: Rider;
  pts: number;
}

interface Props {
  title: string;
  standings: StandingRow[];
  universe: Record<string, any>; // Universe type
  playerTeamId: string;
  showWinsPodiums?: boolean;
}

export function StandingsTable({ title, standings, universe, playerTeamId, showWinsPodiums }: Props) {
  return (
    <div class="panel">
      <h3>{title}</h3>
      <table class="data">
        <thead>
          <tr>
            <th>#</th>
            <th>Rider</th>
            <th>Team</th>
            {showWinsPodiums && <th style="text-align:right">Wins</th>}
            {showWinsPodiums && <th style="text-align:right">Podiums</th>}
            <th style="text-align:right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const t = row.rider.teamId ? universe.teams[row.rider.teamId] : null;
            return (
              <tr class={`${t?.id === playerTeamId ? 'player' : ''} ${i === 0 ? 'p1' : ''}`}>
                <td class="pos-badge">{i + 1}</td>
                <td>#{row.rider.number} {row.rider.name}</td>
                <td class="muted">{t?.shortName ?? '—'}</td>
                {showWinsPodiums && <td style="text-align:right">{row.rider.careerWins}</td>}
                {showWinsPodiums && <td style="text-align:right">{row.rider.careerPodiums}</td>}
                <td style="text-align:right"><b>{row.pts}</b></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
