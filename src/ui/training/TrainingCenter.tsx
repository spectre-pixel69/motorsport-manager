// Training Center — skill development interface
// Select rider → choose skill focus → monitor stamina + gains

import { useState } from 'preact/hooks';
import type { Rider, RiderSkills, ClassId } from '../../data/types';
import type { TrainingResult } from '../../game/training';
import { calculateTrainingGain, trainRider, regenStamina } from '../../game/training';
import './training.css';

interface Props {
  riders: Rider[];
  facilityLevel: number;
  coachQuality: number;
  onClose: () => void;
}

export function TrainingCenter({ riders, facilityLevel, coachQuality, onClose }: Props) {
  const [selectedRider, setSelectedRider] = useState<Rider | null>(riders[0] ?? null);
  const [selectedSkill, setSelectedSkill] = useState<keyof RiderSkills>('pace');
  const [trainingResults, setTrainingResults] = useState<TrainingResult | null>(null);

  if (!selectedRider) {
    return (
      <div class="training-center">
        <button class="btn-close" onClick={onClose}>← Back</button>
        <p>No riders available to train.</p>
      </div>
    );
  }

  const handleTrain = () => {
    const result = trainRider(selectedRider, selectedSkill, facilityLevel, coachQuality);
    setTrainingResults(result);

    // Update rider (in real app, would update game state)
    selectedRider.skills[selectedSkill] += result.skillGain;
    selectedRider.stamina = Math.max(0, selectedRider.stamina - result.staminaCost);
  };

  const handleRest = () => {
    selectedRider.stamina = regenStamina(selectedRider.stamina, 1);
    setTrainingResults(null);
  };

  const expectedGain = calculateTrainingGain(selectedRider, selectedSkill, facilityLevel, coachQuality);

  return (
    <div class="training-center">
      <div class="training-header">
        <h2>🏋️ Training Center</h2>
        <button class="btn-close" onClick={onClose}>← Back</button>
      </div>

      <div class="training-content">
        {/* Rider Selection */}
        <div class="rider-select">
          <h3>Select Rider</h3>
          <div class="rider-list">
            {riders.map(r => (
              <button
                key={r.id}
                class={`rider-option ${selectedRider?.id === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRider(r)}
              >
                <div class="rider-name">{r.name}</div>
                <div class="rider-stamina">
                  Stamina: {Math.round(r.stamina)}/100
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Skill Selection & Training */}
        <div class="training-panel">
          <h3>Choose Skill to Train</h3>
          <div class="skill-grid">
            {(['pace', 'braking', 'cornerSpeed', 'racecraft', 'consistency', 'starts', 'fitness', 'wet', 'feedback'] as (keyof RiderSkills)[]).map(skill => (
              <button
                key={skill}
                class={`skill-btn ${selectedSkill === skill ? 'active' : ''}`}
                onClick={() => setSelectedSkill(skill)}
              >
                <div class="skill-name">
                  {skill.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div class="skill-level">
                  {Math.round(selectedRider.skills[skill])}
                  <span class="skill-potential"> / {selectedRider.potential}</span>
                </div>
                <div class="expected-gain">
                  +{calculateTrainingGain(selectedRider, skill, facilityLevel, coachQuality).toFixed(1)}
                </div>
              </button>
            ))}
          </div>

          {/* Training Info */}
          <div class="training-info">
            <div class="info-row">
              <span>Current Skill:</span>
              <span class="value">{Math.round(selectedRider.skills[selectedSkill])}</span>
            </div>
            <div class="info-row">
              <span>Potential Ceiling:</span>
              <span class="value">{selectedRider.potential}</span>
            </div>
            <div class="info-row">
              <span>Expected Gain:</span>
              <span class="value gain">+{expectedGain.toFixed(1)}</span>
            </div>
            <div class="info-row">
              <span>Facility Bonus:</span>
              <span class="value">Level {facilityLevel}</span>
            </div>
            <div class="info-row">
              <span>Coach Quality:</span>
              <span class="value">{coachQuality.toFixed(1)}x</span>
            </div>
          </div>

          {/* Training Results */}
          {trainingResults && (
            <div class={`training-result ${trainingResults.overtrained ? 'overtrained' : ''}`}>
              <h4>Training Complete</h4>
              <div class="result-skill">
                <span>{selectedSkill}:</span>
                <span class="result-gain">+{trainingResults.skillGain.toFixed(1)}</span>
              </div>
              <div class="result-stamina">
                Stamina Used: {trainingResults.staminaCost}
              </div>
              {trainingResults.overtrained && (
                <div class="overtrain-warning">
                  ⚠️ Overtrained! Temporary −2 to −5 skill penalty. Rest to recover.
                  Injury risk: {Math.round(trainingResults.injuryRisk)}%
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div class="training-actions">
            <button
              class="btn-train"
              onClick={handleTrain}
              disabled={selectedRider.stamina < 15}
            >
              🏋️ Train ({15} Stamina)
            </button>
            <button class="btn-rest" onClick={handleRest}>
              😴 Rest (+10 Stamina)
            </button>
          </div>
        </div>

        {/* Stamina Bar */}
        <div class="stamina-section">
          <h3>Stamina</h3>
          <div class="stamina-display">
            <div class="stamina-label">{selectedRider.name}</div>
            <div class="stamina-bar">
              <div
                class="stamina-fill"
                style={{
                  width: `${selectedRider.stamina}%`,
                  backgroundColor: selectedRider.stamina > 50 ? '#2ecc71' : selectedRider.stamina > 20 ? '#f39c12' : '#e74c3c',
                }}
              />
            </div>
            <div class="stamina-value">{Math.round(selectedRider.stamina)}/100</div>
          </div>
          {selectedRider.stamina < 20 && (
            <div class="stamina-warning">
              ⚠️ Low stamina: training below 20 carries injury risk
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
