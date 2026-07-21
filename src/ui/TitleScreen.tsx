// Title screen for Paddock Boss — entry point for new career
import type { JSX } from 'preact';

interface Props {
  onNewCareer: () => void;
}

export function TitleScreen({ onNewCareer }: Props): JSX.Element {
  return (
    <div class="screen title-screen" style="flex-direction: column;">
      <div class="title-logo">
        PADDOCK <span class="boss">BOSS</span>
      </div>
      <div class="title-tag">Run the team. Own the sport.</div>
      <button class="primary" style="margin-top: 32px; padding: 14px 32px; font-size: 16px;" onClick={onNewCareer}>
        New Career
      </button>
    </div>
  );
}
