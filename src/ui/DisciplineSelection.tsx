// Discipline selection screen — choose between GP, SBK, or NAMC
import type { JSX } from 'preact';
import type { DisciplineId } from '../data/types';
import { DISCIPLINE_META } from '../data/brand';

interface Props {
  selectedDiscipline: DisciplineId;
  onSelect: (discipline: DisciplineId) => void;
  onBack: () => void;
}

export function DisciplineSelection({ selectedDiscipline, onSelect, onBack }: Props): JSX.Element {
  return (
    <div class="screen">
      <div class="topbar">
        <button class="ghost" onClick={onBack}>← Back</button>
        <div class="grow" />
        <span class="season-chip">New Career · step 1/3</span>
      </div>
      <div class="content scroll">
        <div class="wizard">
          <h2 class="mb">Choose your discipline</h2>
          <div class="choice-grid">
            {(Object.keys(DISCIPLINE_META) as DisciplineId[]).map(d => (
              <div
                key={d}
                class={`choice-card ${selectedDiscipline === d ? 'sel' : ''}`}
                onClick={() => onSelect(d)}
              >
                <h4 style={{ color: DISCIPLINE_META[d].accent }}>
                  {DISCIPLINE_META[d].name}
                </h4>
                <p>{DISCIPLINE_META[d].blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
