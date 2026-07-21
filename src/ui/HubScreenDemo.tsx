import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface HubScreenData {
  teamName: string;
  season: string;
  rank: number;
  totalTeams: number;
  teamVitals: {
    balance: number;
    prestige: number;
    reliability: number;
    rdLevel: number;
  };
  seasonProgress: number;
  nextRace: {
    trackName: string;
    location: string;
    discipline: string;
    round: number;
    totalRounds: number;
  };
  topRiders: Array<{
    riderName: string;
    points: number;
    position: number;
    bIsPlayerRider: boolean;
  }>;
  ryansBriefing: Array<{
    title: string;
    content: string;
    author: string;
    impact: number;
  }>;
  trackDays: Array<{
    title: string;
    content: string;
    author: string;
    impact: number;
  }>;
}

export function HubScreenDemo() {
  const [hubData, setHubData] = useState<HubScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHubData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/hub');
        if (!response.ok) throw new Error('Failed to fetch hub data');
        const data = await response.json();
        setHubData(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        // Use mock data as fallback
        setHubData({
          teamName: 'Red Racing',
          season: 'Season 2027 • Round 8/20',
          rank: 3,
          totalTeams: 20,
          teamVitals: {
            balance: 180000,
            prestige: 75,
            reliability: 82.5,
            rdLevel: 3,
          },
          seasonProgress: 0.4,
          nextRace: {
            trackName: 'Travis Peak',
            location: 'Montana',
            discipline: 'Outdoor',
            round: 8,
            totalRounds: 20,
          },
          topRiders: [
            { riderName: 'Martinez', points: 456, position: 1, bIsPlayerRider: false },
            { riderName: 'Chen', points: 423, position: 2, bIsPlayerRider: false },
            { riderName: 'Williams', points: 401, position: 3, bIsPlayerRider: false },
            { riderName: 'Davis', points: 378, position: 4, bIsPlayerRider: false },
            { riderName: 'Taylor', points: 356, position: 5, bIsPlayerRider: false },
          ],
          ryansBriefing: [
            {
              title: 'SBK Transfer Rumor',
              content: 'Martinez linked to factory seat for 2028',
              author: 'Ryan',
              impact: 0.8,
            },
            {
              title: 'Injury Update',
              content: 'K. Yamaha out for round 9 with shoulder injury',
              author: 'Ryan',
              impact: 0.6,
            },
          ],
          trackDays: [
            {
              title: 'Engine Optimization',
              content: '+2.3 kg grip available with new mapping',
              author: 'Dustin',
              impact: 0.7,
            },
            {
              title: 'Setup Breakthrough',
              content: 'New spring compound tested, -0.3s/lap potential',
              author: 'Dustin',
              impact: 0.9,
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    loadHubData();
  }, []);

  const getVitalColor = (value: number, isPercentage: boolean = true) => {
    const normalized = isPercentage ? value : (value / 100);
    if (normalized > 0.7) return '#2ecc71'; // green
    if (normalized > 0.4) return '#f39c12'; // gold
    return '#e74c3c'; // red
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #15192e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>🏍️ Loading Paddock Boss...</div>
          <div style={{ opacity: 0.6 }}>Connecting to backend...</div>
        </div>
      </div>
    );
  }

  if (!hubData) {
    return <div>Error loading hub data</div>;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #15192e 100%)',
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      color: '#fff',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { text-shadow: 0 0 10px rgba(243, 156, 18, 0.5), 0 0 20px rgba(243, 156, 18, 0.3); }
          50% { text-shadow: 0 0 20px rgba(243, 156, 18, 0.8), 0 0 40px rgba(243, 156, 18, 0.6); }
        }
        @keyframes glow-green {
          0%, 100% { text-shadow: 0 0 5px rgba(46, 204, 113, 0.3); }
          50% { text-shadow: 0 0 15px rgba(46, 204, 113, 0.8); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .header { animation: slide-in-left 0.5s ease-out; }
        .rank-panel { animation: pulse-gold 2.5s infinite; }
        .vital-metric { animation: slide-in-up 0.6s ease-out backwards; }
        .vital-metric:nth-child(1) { animation-delay: 0.1s; }
        .vital-metric:nth-child(2) { animation-delay: 0.2s; }
        .vital-metric:nth-child(3) { animation-delay: 0.3s; }
        .vital-metric:nth-child(4) { animation-delay: 0.4s; }
        .button-action { transition: all 0.2s ease; }
        .button-action:hover { transform: translateY(-2px); filter: brightness(1.2); }
      `}</style>

      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(42, 58, 90, 0.5)',
        background: 'rgba(21, 25, 46, 0.8)',
        backdropFilter: 'blur(10px)',
      }} className="header">
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f39c12', marginBottom: '4px' }}>
          🏭 {hubData.teamName}
        </div>
        <div style={{ fontSize: '14px', color: '#8899aa' }}>
          {hubData.season}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        padding: '16px',
        overflow: 'hidden',
      }}>
        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto' }}>
          {/* Team Vitals */}
          <div style={{
            background: 'rgba(21, 25, 46, 0.8)',
            border: '1px solid rgba(42, 58, 90, 0.5)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8899aa', marginBottom: '12px', textTransform: 'uppercase' }}>
              ⚡ Team Vitals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="vital-metric">
                <div style={{ fontSize: '11px', color: '#8899aa' }}>Balance</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: getVitalColor(hubData.teamVitals.balance / 2500000 * 100) }}>
                  ${(hubData.teamVitals.balance / 1000).toFixed(0)}k
                </div>
              </div>
              <div className="vital-metric">
                <div style={{ fontSize: '11px', color: '#8899aa' }}>Prestige</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: getVitalColor(hubData.teamVitals.prestige) }}>
                  {hubData.teamVitals.prestige}
                </div>
              </div>
              <div className="vital-metric">
                <div style={{ fontSize: '11px', color: '#8899aa' }}>Reliability</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: getVitalColor(hubData.teamVitals.reliability) }}>
                  {hubData.teamVitals.reliability.toFixed(1)}%
                </div>
              </div>
              <div className="vital-metric">
                <div style={{ fontSize: '11px', color: '#8899aa' }}>R&D Level</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3498db' }}>
                  Lv.{hubData.teamVitals.rdLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Season Progress */}
          <div style={{
            background: 'rgba(21, 25, 46, 0.8)',
            border: '1px solid rgba(42, 58, 90, 0.5)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '11px', color: '#8899aa', marginBottom: '8px' }}>
              📅 Season Progress
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.5)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${hubData.seasonProgress * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2ecc71, #f39c12)',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#8899aa', marginTop: '6px', textAlign: 'center' }}>
              {Math.round(hubData.seasonProgress * hubData.nextRace.totalRounds)}/{hubData.nextRace.totalRounds} rounds
            </div>
          </div>

          {/* Next Race */}
          <div style={{
            background: 'rgba(46, 204, 113, 0.1)',
            border: '1px solid rgba(46, 204, 113, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8899aa', marginBottom: '8px' }}>
              🏁 Next Race
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
              {hubData.nextRace.trackName}
            </div>
            <div style={{ fontSize: '12px', color: '#8899aa', marginBottom: '12px' }}>
              {hubData.nextRace.discipline} • {hubData.nextRace.location}
            </div>
            <button
              className="button-action"
              style={{
                width: '100%',
                padding: '12px',
                background: '#e74c3c',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                animation: 'pulse-gold 2s infinite',
              }}
              onClick={() => alert('🏍️ Race simulation starting...')}
            >
              🚀 Go Racing
            </button>
          </div>

          {/* Ryan's Briefing */}
          <div style={{
            background: 'rgba(21, 25, 46, 0.8)',
            border: '1px solid rgba(42, 58, 90, 0.5)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(10px)',
            fontSize: '12px',
          }}>
            <div style={{ fontWeight: 'bold', color: '#8899aa', marginBottom: '8px' }}>
              📰 Ryan's Briefing
            </div>
            {hubData.ryansBriefing.map((item: any) => (
              <div key={item.title} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(42, 58, 90, 0.3)' }}>
                <div style={{ fontWeight: 'bold', color: '#f39c12' }}>• {item.title}</div>
                <div style={{ color: '#8899aa', fontSize: '11px' }}>{item.content}</div>
              </div>
            ))}
          </div>

          {/* Track Days */}
          <div style={{
            background: 'rgba(21, 25, 46, 0.8)',
            border: '1px solid rgba(42, 58, 90, 0.5)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(10px)',
            fontSize: '12px',
          }}>
            <div style={{ fontWeight: 'bold', color: '#8899aa', marginBottom: '8px' }}>
              🔧 Track Days (Dustin)
            </div>
            {hubData.trackDays.map((item: any) => (
              <div key={item.title} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(42, 58, 90, 0.3)' }}>
                <div style={{ fontWeight: 'bold', color: '#3498db' }}>• {item.title}</div>
                <div style={{ color: '#8899aa', fontSize: '11px' }}>{item.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto' }}>
          {/* Rank Display */}
          <div
            className="rank-panel"
            style={{
              background: 'rgba(243, 156, 18, 0.15)',
              border: '2px solid rgba(243, 156, 18, 0.4)',
              borderRadius: '12px',
              padding: '20px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#f39c12' }}>
              {hubData.rank}
            </div>
            <div style={{ fontSize: '14px', color: '#8899aa' }}>
              of {hubData.totalTeams} teams
            </div>
          </div>

          {/* Top Riders */}
          <div style={{
            background: 'rgba(21, 25, 46, 0.8)',
            border: '1px solid rgba(42, 58, 90, 0.5)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#8899aa', marginBottom: '8px', textTransform: 'uppercase' }}>
              🏆 Top Riders
            </div>
            {hubData.topRiders.map((rider: any) => (
              <div
                key={rider.riderName}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(42, 58, 90, 0.3)',
                  fontSize: '12px',
                  color: rider.bIsPlayerRider ? '#2ecc71' : '#fff',
                  fontWeight: rider.bIsPlayerRider ? 'bold' : 'normal',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>#{rider.position} {rider.riderName}</span>
                  <span>{rider.points} pts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Management Shortcuts */}
          <div style={{
            background: 'rgba(21, 25, 46, 0.8)',
            border: '1px solid rgba(42, 58, 90, 0.5)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}>
            <button
              className="button-action"
              style={{
                padding: '12px',
                background: 'rgba(52, 152, 219, 0.8)',
                border: '1px solid rgba(52, 152, 219, 0.5)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => alert('🛒 Opening Showroom...')}
            >
              🛒 Showroom
            </button>
            <button
              className="button-action"
              style={{
                padding: '12px',
                background: 'rgba(155, 89, 182, 0.8)',
                border: '1px solid rgba(155, 89, 182, 0.5)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => alert('🔧 Opening Garage...')}
            >
              🔧 Garage
            </button>
            <button
              className="button-action"
              style={{
                padding: '12px',
                background: 'rgba(230, 126, 34, 0.8)',
                border: '1px solid rgba(230, 126, 34, 0.5)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => alert('💪 Opening Training Center...')}
            >
              💪 Training
            </button>
            <button
              className="button-action"
              style={{
                padding: '12px',
                background: 'rgba(26, 188, 156, 0.8)',
                border: '1px solid rgba(26, 188, 156, 0.5)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => alert('🔬 Opening R&D Center...')}
            >
              🔬 R&D
            </button>
            <button
              className="button-action"
              style={{
                gridColumn: '1 / -1',
                padding: '12px',
                background: 'rgba(231, 76, 60, 0.3)',
                border: '1px solid rgba(231, 76, 60, 0.5)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => alert('← Returning to Main Menu...')}
            >
              ← Exit
            </button>
          </div>

          {/* Debug Info */}
          {error && (
            <div style={{
              background: 'rgba(231, 76, 60, 0.2)',
              border: '1px solid rgba(231, 76, 60, 0.5)',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '11px',
              color: '#e74c3c',
            }}>
              ⚠️ Backend: Using mock data ({error})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
