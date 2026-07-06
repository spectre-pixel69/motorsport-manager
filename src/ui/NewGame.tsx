// New career wizard: discipline -> (NAMC championship) -> mode -> identity.

import { useState } from 'preact/hooks';
import type { ChampionshipId, DisciplineId, LogoSpec } from '../data/types';
import { DISCIPLINE_META } from '../data/brand';
import { newCareer, saveCareer, type CareerState } from '../game/state';
import { buildUniverse, teamsOf } from '../data/universe';
import { randomLogo } from '../logo/logos';
import { mulberry32 } from '../util/rng';
import { Logo } from './Logo';

interface Props { onStart: (state: CareerState) => void; onBack: () => void; }

export function NewGame({ onStart, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [discipline, setDiscipline] = useState<DisciplineId>('namc');
  const [championship, setChampionship] = useState<ChampionshipId>('fourStroke');
  const [mode, setMode] = useState<'create' | 'takeover'>('create');
  const [teamName, setTeamName] = useState('');
  const [primary, setPrimary] = useState('#e2261f');
  const [secondary, setSecondary] = useState('#101214');
  const [logo, setLogo] = useState<LogoSpec | null>(null);
  const [takeoverId, setTakeoverId] = useState<string | null>(null);
  const [previewSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));

  const rollLogo = () => {
    const rng = mulberry32(Math.floor(Math.random() * 2 ** 31));
    const spec = randomLogo(rng, teamName || 'PB');
    spec.primary = primary; spec.secondary = secondary;
    setLogo(spec);
  };

  const uploadLogo = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogo({ markId: 0, containerId: 0, styleId: 0, primary, secondary, accent: primary, initials: '', custom: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const start = () => {
    const state = newCareer({
      discipline,
      championship: discipline === 'namc' ? championship : 'road',
      mode,
      teamName,
      colors: { primary, secondary },
      logo: logo ?? undefined,
      takeoverTeamId: takeoverId ?? undefined,
    });
    saveCareer(state);
    onStart(state);
  };

  // preview universe for takeover list (throwaway, same structure)
  const previewTeams = () => {
    const u = buildUniverse(previewSeed);
    return teamsOf(u, discipline, discipline === 'namc' ? championship : 'road')
      .sort((a, b) => b.prestige - a.prestige);
  };

  return (
    <div class="screen">
      <div class="topbar">
        <button class="ghost" onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>&larr; Back</button>
        <div class="grow" />
        <span class="season-chip">New Career &middot; step {step + 1}/4</span>
      </div>
      <div class="content scroll">
        <div class="wizard">
          {step === 0 && (
            <>
              <h2 class="mb">Choose your discipline</h2>
              <div class="choice-grid">
                {(Object.keys(DISCIPLINE_META) as DisciplineId[]).map(d => (
                  <div class={`choice-card ${discipline === d ? 'sel' : ''}`} onClick={() => { setDiscipline(d); setStep(d === 'namc' ? 1 : 2); }}>
                    <h4 style={{ color: DISCIPLINE_META[d].accent }}>{DISCIPLINE_META[d].name}</h4>
                    <p>{DISCIPLINE_META[d].blurb}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h2 class="mb">NAMC — pick your championship</h2>
              <div class="choice-grid">
                <div class={`choice-card ${championship === 'fourStroke' ? 'sel' : ''}`} onClick={() => { setChampionship('fourStroke'); setStep(2); }}>
                  <h4>Four-Stroke Championship</h4>
                  <p>The thumper war. 350 / 250 / 125 / Women's Pro. 20 charters, 24 rounds.</p>
                </div>
                <div class={`choice-card ${championship === 'twoStroke' ? 'sel' : ''}`} onClick={() => { setChampionship('twoStroke'); setStep(2); }}>
                  <h4>Two-Stroke Championship</h4>
                  <p>Premix and braaap. Identical rules, two-stroke machinery only.</p>
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 class="mb">How do you enter the paddock?</h2>
              <div class="choice-grid">
                <div class={`choice-card ${mode === 'create' ? 'sel' : ''}`} onClick={() => { setMode('create'); setStep(3); }}>
                  <h4>Found your own team</h4>
                  <p>{discipline === 'namc'
                    ? 'A charter came up at auction and you grabbed it. Tight budget, hungry roster — the underdog climb starts now.'
                    : 'Start at the bottom of the ladder with a small budget and unproven riders.'}</p>
                </div>
                <div class={`choice-card ${mode === 'takeover' ? 'sel' : ''}`} onClick={() => { setMode('takeover'); setStep(3); }}>
                  <h4>Take over a team</h4>
                  <p>Step into an existing outfit — backmarker or title contender, your pick.</p>
                </div>
              </div>
            </>
          )}
          {step === 3 && mode === 'create' && (
            <>
              <h2 class="mb">Your team identity</h2>
              <div class="panel">
                <h3>Team name</h3>
                <input type="text" placeholder="e.g. Redline Holeshot Racing" value={teamName}
                  onInput={e => setTeamName((e.target as HTMLInputElement).value)} />
              </div>
              <div class="panel">
                <h3>Colors</h3>
                <div class="row">
                  <label class="row">Primary <input type="color" value={primary} onInput={e => setPrimary((e.target as HTMLInputElement).value)} /></label>
                  <label class="row">Secondary <input type="color" value={secondary} onInput={e => setSecondary((e.target as HTMLInputElement).value)} /></label>
                </div>
              </div>
              <div class="panel">
                <h3>Logo</h3>
                <div class="logo-preview">
                  <div class="logo-box">{logo ? <Logo spec={logo} size={64} /> : <span class="muted">no logo</span>}</div>
                  <div class="row">
                    <button onClick={rollLogo}>🎲 Randomize</button>
                    <label>
                      <button onClick={(e) => ((e.target as HTMLElement).closest('label')!.querySelector('input') as HTMLInputElement).click()}>📁 Upload</button>
                      <input type="file" accept="image/*" style="display:none" onChange={uploadLogo} />
                    </label>
                  </div>
                </div>
                <p class="muted" style="margin-top:8px">Randomize mixes 30 base marks, 6 containers and 4 styles in your colors. Or upload your own image.</p>
              </div>
              <button class="primary" disabled={!teamName.trim()} onClick={start}>Start Career &rarr;</button>
            </>
          )}
          {step === 3 && mode === 'takeover' && (
            <>
              <h2 class="mb">Choose a team to take over</h2>
              {previewTeams().map(t => (
                <div class={`choice-card mb ${takeoverId === t.id ? 'sel' : ''}`} onClick={() => setTakeoverId(t.id)}>
                  <div class="row">
                    <Logo spec={t.logo} size={36} />
                    <div>
                      <h4>{t.name}</h4>
                      <p>Prestige {t.prestige} &middot; {t.dualCharter ? 'Dual-charter organization' : 'Single charter'}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button class="primary" disabled={!takeoverId} onClick={() => {
                // rebuild with same seed so takeover id matches the real universe
                const state = newCareer({
                  seed: previewSeed, discipline,
                  championship: discipline === 'namc' ? championship : 'road',
                  mode: 'takeover', takeoverTeamId: takeoverId!,
                });
                saveCareer(state);
                onStart(state);
              }}>Take Over &rarr;</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
