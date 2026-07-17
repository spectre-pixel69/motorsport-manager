// League Health Panel — Rider Welfare Fund, Penalties, Team Infractions (§13.1-13.5)

import type { CareerState } from '../../game/state';

interface Props {
  state: CareerState;
}

export function LeagueHealth({ state }: Props) {
  const u = state.universe;
  const wf = state.welfareFund;

  // Collect all penalties by team
  const penaltiesByTeam = new Map<string, typeof u.teams[string]['penalties']>();
  for (const team of Object.values(u.teams)) {
    if (team.penalties && team.penalties.length > 0) {
      penaltiesByTeam.set(team.id, team.penalties);
    }
  }

  // Tier colors
  const tierColor = (tier: number): string => {
    switch (tier) {
      case 1: return '#3498db'; // Blue - warning
      case 2: return '#f39c12'; // Gold - fine
      case 3: return '#e74c3c'; // Red - suspension
      case 4: return '#c0392b'; // Dark red - charter revoked
      default: return '#95a5a6';
    }
  };

  const tierLabel = (tier: number): string => {
    switch (tier) {
      case 1: return '⚠️ Warning';
      case 2: return '💰 Fine';
      case 3: return '🚫 Suspended';
      case 4: return '❌ Charter Revoked';
      default: return 'Unknown';
    }
  };

  return (
    <div class="league-health">
      {/* Rider Welfare Fund (§13.5) */}
      <div class="panel">
        <h3>💰 Rider Welfare Fund (§13.5)</h3>
        <div class="welfare-summary">
          <div class="welfare-stat">
            <span class="label">Total Accumulated</span>
            <span class="value large">${wf.totalAccumulated.toLocaleString()}</span>
          </div>
          <div class="welfare-stat">
            <span class="label">Fines Collected</span>
            <span class="value">{wf.fineHistory.length}</span>
          </div>
        </div>

        {wf.fineHistory.length > 0 ? (
          <div class="fine-history">
            <h4>Recent Fines</h4>
            <table class="data">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Team</th>
                  <th>Amount</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {wf.fineHistory.slice(-10).reverse().map((f, i) => {
                  const team = u.teams[f.teamId];
                  return (
                    <tr key={i}>
                      <td>R{f.round}</td>
                      <td>{team?.name || 'Unknown'}</td>
                      <td class="text-right"><strong>${f.amount.toLocaleString()}</strong></td>
                      <td class="muted">{f.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p class="muted">No fines issued yet this season.</p>
        )}
      </div>

      {/* Team Penalties & Infractions (§13.1) */}
      {penaltiesByTeam.size > 0 && (
        <div class="panel">
          <h3>⚖️ Penalties & Infractions (§13.1)</h3>

          {Array.from(penaltiesByTeam.entries()).map(([teamId, penalties]) => {
            const team = u.teams[teamId];
            if (!team) return null;

            return (
              <div class="team-penalties" key={teamId}>
                <h4>{team.name}</h4>

                {team.charterRevoked && (
                  <div class="alert charter-revoked">
                    ❌ CHARTER REVOKED — This team can no longer compete. Riders become free agents.
                  </div>
                )}

                <div class="penalties-list">
                  {penalties.map(p => (
                    <div
                      class="penalty-card"
                      key={p.id}
                      style={{ borderLeftColor: tierColor(p.tier) }}
                    >
                      <div class="penalty-header">
                        <span class="tier-badge" style={{ backgroundColor: tierColor(p.tier) }}>
                          {tierLabel(p.tier)}
                        </span>
                        <span class="round">R{p.issuedRound + 1}</span>
                      </div>
                      <div class="penalty-body">
                        <div class="reason">{p.description}</div>
                        {p.reason && <div class="code muted">{p.reason}</div>}
                        {p.fineAmount && <div class="fine">💰 ${p.fineAmount.toLocaleString()}</div>}
                        {p.suspensionRounds && (
                          <div class="suspension">
                            🚫 {p.suspensionRounds} round{p.suspensionRounds !== 1 ? 's' : ''} suspension
                            {p.suspensionStart && ` starting R${p.suspensionStart + 1}`}
                          </div>
                        )}
                        {p.isTerminalViolation && (
                          <div class="terminal">⛔ Terminal Technical Violation</div>
                        )}
                      </div>
                      {p.resolvedRound && (
                        <div class="resolved muted">✓ Resolved after R{p.resolvedRound + 1}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Three-Strike Summary */}
      <div class="panel">
        <h3>⛔ Three-Strike Summary</h3>
        <table class="data">
          <thead>
            <tr>
              <th>Team</th>
              <th>Strikes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(u.teams)
              .filter(t => t.discipline === 'namc' && (t.strikes > 0 || t.charterRevoked))
              .map(t => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>
                    <strong>{t.strikes}/3</strong>
                  </td>
                  <td>
                    {t.charterRevoked ? (
                      <span class="alert">❌ Charter Revoked</span>
                    ) : t.strikes === 0 ? (
                      <span class="muted">Clean</span>
                    ) : (
                      <span class="warning">{3 - t.strikes} strike{3 - t.strikes !== 1 ? 's' : ''} remaining</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <p class="muted" style="margin-top:8px;font-size:11px">
          Three strikes system (§13.1): Strike 1 = warning, Strike 2 = fine, Strike 3 = suspension or charter revocation.
        </p>
      </div>
    </div>
  );
}
