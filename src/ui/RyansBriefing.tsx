// Ryan's Briefing: Inter-league news segment from Throttlesauce
// Shows latest happenings across NAMC, GP, and SBK

import { h } from 'preact';
import type { NewsEvent } from '../data/types';

interface RyansBriefingProps {
  newsArchive: NewsEvent[];
  currentDiscipline: string;
  maxItems?: number;
}

export function RyansBriefing(props: RyansBriefingProps) {
  const { newsArchive, currentDiscipline, maxItems = 5 } = props;

  // Filter to only show news from OTHER disciplines
  const otherDisciplineNews = newsArchive
    .filter(n => n.discipline !== currentDiscipline)
    .sort((a, b) => b.round - a.round)
    .slice(0, maxItems);

  if (otherDisciplineNews.length === 0) {
    return (
      <div class="panel" style={{ padding: '1rem', opacity: 0.6 }}>
        <div class="muted">No inter-league news this week.</div>
      </div>
    );
  }

  return (
    <div class="panel" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        <div style={{ fontSize: '1.5rem' }}>📺</div>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ryan's Briefing</h3>
        <div class="muted" style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>
          Throttlesauce Network
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {otherDisciplineNews.map(news => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>

      <div class="muted" style={{ fontSize: '0.75rem', marginTop: '1rem' }}>
        Updates from other leagues keep your team sharp and aware of market moves.
      </div>
    </div>
  );
}

function NewsCard(props: { news: NewsEvent }) {
  const { news } = props;

  const disciplineLabel = {
    namc: '🏍️ NAMC',
    gp: '🏁 GP',
    sbk: '🔴 SBK',
  }[news.discipline] || news.discipline;

  const typeIcon = {
    signing: '✍️',
    injury: '🤕',
    breakout: '⭐',
    rivalry: '🔥',
    'championship-drama': '🏆',
    'team-conflict': '⚠️',
    'coaching-change': '👨‍💼',
    'transfer-rumor': '💬',
    comeback: '🚀',
    'rookie-sensation': '🌟',
  }[news.type] || '📢';

  return (
    <div
      style={{
        borderLeft: '3px solid #3498db',
        paddingLeft: '0.8rem',
        paddingRight: '0.8rem',
        paddingTop: '0.6rem',
        paddingBottom: '0.6rem',
        backgroundColor: 'rgba(52, 152, 219, 0.05)',
        borderRadius: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
        <span>{typeIcon}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#3498db' }}>
          {disciplineLabel}
        </span>
        <span class="muted" style={{ fontSize: '0.75rem', marginLeft: 'auto' }}>
          Round {news.round}
        </span>
      </div>

      <div style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem', color: '#e8e8e8' }}>
        {news.headline}
      </div>

      <div style={{ fontSize: '0.85rem', color: '#b0b8c0', lineHeight: '1.4' }}>
        "{news.body}"
      </div>

      {news.impact?.playerTeamSentiment && (
        <div
          style={{
            fontSize: '0.75rem',
            marginTop: '0.4rem',
            color:
              news.impact.playerTeamSentiment > 0
                ? '#2ecc71'
                : news.impact.playerTeamSentiment < 0
                  ? '#e74c3c'
                  : '#f39c12',
          }}
        >
          {news.impact.playerTeamSentiment > 0 && '↗️ Good news for competitors'}
          {news.impact.playerTeamSentiment < 0 && '↘️ Opportunity brewing'}
          {news.impact.playerTeamSentiment === 0 && '→ Worth watching'}
        </div>
      )}
    </div>
  );
}
