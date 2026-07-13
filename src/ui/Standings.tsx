// Standings view component — shows rider, team, and tire standings

import { useState } from 'preact/hooks';
import type { ChampionshipId, ClassId } from '../data/types';
import { classById } from '../data/classes';
import { riderStandingsFor, teamStandingsFor, type CareerState } from '../game/state';
import { StandingsTable } from './StandingsTable';

interface Props {
  state: CareerState;
}

export function Standings({ state }: Props) {
  const [stClass, setStClass] = useState<ClassId>(state.focusClass);
  const [stChamp, setStChamp] = useState<ChampionshipId>(state.championship);

  const u = state.universe;
  const team = u.teams[state.playerTeamId];

  // Build class options based on discipline
  const classOptions: { cls: ClassId; champ: ChampionshipId }[] =
    state.discipline === 'namc'
      ? (['fourStroke'] as ChampionshipId[]).flatMap(ch =>
          ['c350', 'c250', 'c125', 'women'].map(cls => ({ cls: cls as ClassId, champ: ch }))
        )
      : ['gp1', 'gp2', 'gp3', 'sbk', 'ss600', 'ss300'].map(cls => ({ cls: cls as ClassId, champ: 'road' as ChampionshipId }));

  return (
    <>
      {/* Class filter tabs */}
      <div class="row mb" style="overflow-x:auto">
        {classOptions.map(({ cls, champ }) => (
          <button
            class={stClass === cls && stChamp === champ ? 'primary' : ''}
            onClick={() => { setStClass(cls); setStChamp(champ); }}
          >
            {state.discipline === 'namc'
              ? `${champ === 'fourStroke' ? '4S' : '2S'} ${classById(cls).shortName}`
              : classById(cls).shortName}
          </button>
        ))}
      </div>

      {/* Rider standings */}
      <StandingsTable
        title="Rider Standings"
        standings={riderStandingsFor(state, stClass, stChamp).slice(0, 40)}
        universe={u}
        playerTeamId={team.id}
        showWinsPodiums={true}
      />

      {/* Team championship (NAMC only) */}
      {state.discipline === 'namc' && (
        <div class="panel">
          <h3>Team Championship — {stChamp === 'fourStroke' ? 'Four-Stroke' : 'Two-Stroke'}</h3>
          <table class="data">
            <thead><tr><th>#</th><th>Team</th><th style="text-align:right">Pts</th></tr></thead>
            <tbody>
              {teamStandingsFor(state, stChamp).map((row, i) => (
                <tr class={`${row.team.id === team.id ? 'player' : ''} ${i === 0 ? 'p1' : ''}`}>
                  <td class="pos-badge">{i + 1}</td>
                  <td>{row.team.name}{row.team.dualCharter ? ' ⬥' : ''}</td>
                  <td style="text-align:right"><b>{row.pts}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p class="muted" style="margin-top:6px">⬥ dual-charter: competes for recognition; prize money cascades to single-charter teams.</p>
        </div>
      )}

      {/* Tire Manufacturer Championship (NAMC only) */}
      {state.discipline === 'namc' && (
        <div class="panel">
          <h3>Tire Manufacturer Championship</h3>
          <table class="data">
            <tbody>
              {Object.entries(state.standings.tires).sort((a, b) => b[1] - a[1]).map(([brand, pts], i) => (
                <tr class={i === 0 ? 'p1' : ''}>
                  <td class="pos-badge">{i + 1}</td>
                  <td>{u.tireBrands[brand]?.name ?? brand}</td>
                  <td style="text-align:right"><b>{pts}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
