// New career wizard: title screen -> discipline -> team identity
// Simplified flow for alpha 1.1 (NAMC-focused, single mode)

import { useState } from 'preact/hooks';
import type { DisciplineId, LogoSpec } from '../data/types';
import { newCareer, saveCareer, type CareerState } from '../game/state';
import { initTelemetry, logCareerCreate } from '../util/telemetry';
import { TitleScreen } from './TitleScreen';
import { DisciplineSelection } from './DisciplineSelection';
import { TeamIdentity } from './TeamIdentity';

type Screen = 'title' | 'discipline' | 'identity';

interface Props {
  onStart: (state: CareerState) => void;
  onBack: () => void;
}

export function NewGame({ onStart, onBack }: Props) {
  const [screen, setScreen] = useState<Screen>('title');
  const [discipline, setDiscipline] = useState<DisciplineId>('namc');
  const [teamName, setTeamName] = useState('');
  const [primary, setPrimary] = useState('#e2261f');
  const [secondary, setSecondary] = useState('#101214');
  const [logo, setLogo] = useState<LogoSpec | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectDiscipline = (d: DisciplineId) => {
    setDiscipline(d);
    setScreen('identity');
  };

  const handleCreateCareer = async () => {
    if (!teamName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const state = newCareer({
        discipline,
        championship: discipline === 'namc' ? 'fourStroke' : 'road',
        mode: 'create',
        teamName,
        colors: { primary, secondary },
        logo: logo ?? undefined,
      });
      // Initialize telemetry for this session
      initTelemetry(state.universe.teams[state.playerTeamId].name, state.discipline, state.seed, state.season);
      logCareerCreate(state);
      saveCareer(state);
      onStart(state);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackFromDiscipline = () => {
    setScreen('title');
  };

  const handleBackFromIdentity = () => {
    setScreen('discipline');
  };

  return (
    <>
      {screen === 'title' && (
        <TitleScreen onNewCareer={() => setScreen('discipline')} />
      )}
      {screen === 'discipline' && (
        <DisciplineSelection
          selectedDiscipline={discipline}
          onSelect={handleSelectDiscipline}
          onBack={handleBackFromDiscipline}
        />
      )}
      {screen === 'identity' && (
        <TeamIdentity
          teamName={teamName}
          primaryColor={primary}
          secondaryColor={secondary}
          logo={logo}
          onTeamNameChange={setTeamName}
          onPrimaryColorChange={setPrimary}
          onSecondaryColorChange={setSecondary}
          onLogoChange={setLogo}
          onCreate={handleCreateCareer}
          onBack={handleBackFromIdentity}
          isLoading={isCreating}
        />
      )}
    </>
  );
}
