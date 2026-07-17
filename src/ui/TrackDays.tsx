// Track Days: Technical bike & setup analysis from Crewman 37/Dustin
// Performance metrics, setup changes, parts management, and race strategy

import { h } from 'preact';
import type { TrackDaysEvent } from '../data/types';

interface TrackDaysProps {
  trackDaysArchive: TrackDaysEvent[];
  maxItems?: number;
}

export function TrackDays(props: TrackDaysProps) {
  const { trackDaysArchive, maxItems = 5 } = props;

  // Show most recent track days items for this team
  const recentItems = trackDaysArchive
    .sort((a, b) => b.round - a.round)
    .slice(0, maxItems);

  if (recentItems.length === 0) {
    return (
      <div class="panel" style={{ padding: '1rem', opacity: 0.6 }}>
        <div class="muted">No technical updates this round.</div>
      </div>
    );
  }

  return (
    <div class="panel" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        <div style={{ fontSize: '1.5rem' }}>🔧</div>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Track Days</h3>
        <div class="muted" style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>
          Crewman 37/Dustin
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {recentItems.map(event => (
          <TrackDaysCard key={event.id} event={event} />
        ))}
      </div>

      <div class="muted" style={{ fontSize: '0.75rem', marginTop: '1rem' }}>
        Technical insights on setup, reliability, and race strategy.
      </div>
    </div>
  );
}

function TrackDaysCard(props: { event: TrackDaysEvent }) {
  const { event } = props;

  const typeIcon = {
    'engine-optimization': '⚙️',
    'setup-breakthrough': '🎯',
    'parts-upgrade': '🔩',
    'reliability-concern': '⚠️',
    'performance-delta': '📊',
    'tire-strategy': '🏍️',
    'wear-analysis': '📉',
    'fuel-efficiency': '⛽',
    'technical-insight': '💡',
  }[event.type] || '🔧';

  const typeLabel = {
    'engine-optimization': 'Engine Tuning',
    'setup-breakthrough': 'Setup Improvement',
    'parts-upgrade': 'Parts & Reliability',
    'reliability-concern': 'Maintenance Alert',
    'performance-delta': 'Pace Analysis',
    'tire-strategy': 'Tire Strategy',
    'wear-analysis': 'Component Wear',
    'fuel-efficiency': 'Fuel Strategy',
    'technical-insight': 'Technical Note',
  }[event.type] || 'Technical Update';

  // Determine color based on event type/sentiment
  let accentColor = '#3498db';
  if (event.type === 'reliability-concern') accentColor = '#e74c3c';
  if (event.type === 'performance-delta' && event.technicalData?.performanceGain && event.technicalData.performanceGain > 0)
    accentColor = '#2ecc71';

  return (
    <div
      style={{
        borderLeft: `3px solid ${accentColor}`,
        paddingLeft: '0.8rem',
        paddingRight: '0.8rem',
        paddingTop: '0.6rem',
        paddingBottom: '0.6rem',
        backgroundColor: accentColor === '#e74c3c' ? 'rgba(231, 76, 60, 0.05)' : 'rgba(52, 152, 219, 0.05)',
        borderRadius: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
        <span>{typeIcon}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: accentColor }}>
          {typeLabel}
        </span>
        {event.technicalData?.performanceGain && (
          <span
            class="muted"
            style={{
              fontSize: '0.75rem',
              marginLeft: 'auto',
              color: event.technicalData.performanceGain > 0 ? '#2ecc71' : '#e74c3c',
              fontWeight: 500,
            }}
          >
            {event.technicalData.performanceGain > 0 ? '+' : ''}
            {event.technicalData.performanceGain.toFixed(1)}ms
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem', color: '#e8e8e8' }}>
        {event.headline}
      </div>

      <div style={{ fontSize: '0.85rem', color: '#b0b8c0', lineHeight: '1.4' }}>
        "{event.body}"
      </div>

      {event.technicalData?.setupAdjustments && event.technicalData.setupAdjustments.length > 0 && (
        <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: '#8892a0' }}>
          {event.technicalData.setupAdjustments.map((adj, i) => (
            <div key={i}>→ {adj}</div>
          ))}
        </div>
      )}

      {event.technicalData?.reliabilityScore && (
        <div style={{ fontSize: '0.75rem', marginTop: '0.3rem', color: '#8892a0' }}>
          Reliability: {event.technicalData.reliabilityScore}%
        </div>
      )}
    </div>
  );
}
