// Team identity screen — customize team name, colors, and logo
import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { LogoSpec } from '../data/types';
import { randomLogo } from '../logo/logos';
import { mulberry32 } from '../util/rng';
import { Logo } from './Logo';

interface Props {
  teamName: string;
  primaryColor: string;
  secondaryColor: string;
  logo: LogoSpec | null;
  onTeamNameChange: (name: string) => void;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
  onLogoChange: (logo: LogoSpec) => void;
  onCreate: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function TeamIdentity({
  teamName,
  primaryColor,
  secondaryColor,
  logo,
  onTeamNameChange,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onLogoChange,
  onCreate,
  onBack,
  isLoading,
}: Props): JSX.Element {
  const handleRandomizeLogo = () => {
    const rng = mulberry32(Math.floor(Math.random() * 2 ** 31));
    const spec = randomLogo(rng, teamName || 'PB');
    spec.primary = primaryColor;
    spec.secondary = secondaryColor;
    onLogoChange(spec);
  };

  const handleUploadLogo = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onLogoChange({
        markId: 0,
        containerId: 0,
        styleId: 0,
        primary: primaryColor,
        secondary: secondaryColor,
        accent: primaryColor,
        initials: '',
        custom: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  };

  const canCreate = teamName.trim().length > 0;

  return (
    <div class="screen">
      <div class="topbar">
        <button class="ghost" onClick={onBack} disabled={isLoading}>← Back</button>
        <div class="grow" />
        <span class="season-chip">New Career · step 3/3</span>
      </div>
      <div class="content scroll">
        <div class="wizard">
          <h2 class="mb">Your team identity</h2>

          <div class="panel">
            <h3>Team Name</h3>
            <input
              type="text"
              placeholder="e.g. Redline Holeshot Racing"
              value={teamName}
              onInput={e => onTeamNameChange((e.target as HTMLInputElement).value)}
              disabled={isLoading}
            />
          </div>

          <div class="panel">
            <h3>Team Colors</h3>
            <div class="row">
              <label class="row">
                Primary
                <input
                  type="color"
                  value={primaryColor}
                  onInput={e => onPrimaryColorChange((e.target as HTMLInputElement).value)}
                  disabled={isLoading}
                />
              </label>
              <label class="row">
                Secondary
                <input
                  type="color"
                  value={secondaryColor}
                  onInput={e => onSecondaryColorChange((e.target as HTMLInputElement).value)}
                  disabled={isLoading}
                />
              </label>
            </div>
          </div>

          <div class="panel">
            <h3>Team Logo</h3>
            <div class="logo-preview">
              <div class="logo-box">
                {logo ? <Logo spec={logo} size={64} /> : <span class="muted">no logo</span>}
              </div>
              <div class="row">
                <button onClick={handleRandomizeLogo} disabled={isLoading}>
                  🎲 Randomize
                </button>
                <label style={{ margin: 0 }}>
                  <button
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).closest('label')?.querySelector('input') as HTMLInputElement;
                      if (input) input.click();
                    }}
                    disabled={isLoading}
                  >
                    📁 Upload
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    style="display:none"
                    onChange={handleUploadLogo}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>
            <p class="muted" style="margin-top:8px">
              Randomize mixes 30 base marks, 6 containers and 4 styles in your colors. Or upload your own image.
            </p>
          </div>

          <button
            class="primary"
            disabled={!canCreate || isLoading}
            onClick={onCreate}
            style="width: 100%"
          >
            {isLoading ? 'Creating career...' : 'Create Career →'}
          </button>
        </div>
      </div>
    </div>
  );
}
