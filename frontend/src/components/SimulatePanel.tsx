import { useState } from 'react';
import { simulate } from '../api';

interface SimulateEvent {
  label: string;
  icon: string;
  claimType: string;
  description: string;
  lat: number;
  lng: number;
  color: string;
}

const EVENTS: SimulateEvent[] = [
  {
    label: 'Flood near Andheri',
    icon: '🌊',
    claimType: 'flood',
    description: 'Severe waterlogging reported on SV Road near Andheri station. Knee-deep water blocking traffic.',
    lat: 19.1136,
    lng: 72.8697,
    color: '#06b6d4',
  },
  {
    label: 'Power Outage Bandra',
    icon: '⚡',
    claimType: 'power_outage',
    description: 'Complete power failure across Bandra West — Hill Road and Linking Road affected. 3000+ households without electricity.',
    lat: 19.0596,
    lng: 72.8295,
    color: '#f59e0b',
  },
  {
    label: 'Traffic Jam Dadar',
    icon: '🚗',
    claimType: 'traffic',
    description: 'Major traffic snarl at Dadar TT circle. 2km backup on Eastern Express Highway. Signal failure suspected.',
    lat: 19.0178,
    lng: 72.8478,
    color: '#10b981',
  },
  {
    label: 'ATM Outage Kurla',
    icon: '🏧',
    claimType: 'atm_outage',
    description: 'Multiple ATMs non-functional in Kurla West near LBS Road. 8 machines offline, long queues forming.',
    lat: 19.0726,
    lng: 72.8845,
    color: '#a78bfa',
  },
];

interface Props {
  onSimulated?: (obsId: string) => void;
}

export default function SimulatePanel({ onSimulated }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ label: string; obsId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (event: SimulateEvent) => {
    if (loading) return;
    setLoading(event.label);
    setError(null);
    setLastResult(null);

    try {
      const result = await simulate({
        claimType: event.claimType,
        description: event.description,
        lat: event.lat,
        lng: event.lng,
      });
      setLastResult({ label: event.label, obsId: result.observationId });
      onSimulated?.(result.observationId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 2, lineHeight: 1.5 }}>
        Click to submit an observation on-chain. 4 agents will vote autonomously. No wallet required.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {EVENTS.map((event) => {
          const isLoading = loading === event.label;
          return (
            <button
              key={event.label}
              id={`simulate-${event.claimType}`}
              onClick={() => handleClick(event)}
              disabled={!!loading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '12px 14px',
                borderRadius: 12,
                border: `1px solid ${isLoading ? event.color + '88' : event.color + '33'}`,
                background: isLoading
                  ? `${event.color}18`
                  : `linear-gradient(135deg, ${event.color}0a 0%, rgba(13,20,36,0.6) 100%)`,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading && !isLoading ? 0.5 : 1,
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.borderColor = event.color + '66';
                  (e.currentTarget as HTMLElement).style.background =
                    `linear-gradient(135deg, ${event.color}18 0%, rgba(13,20,36,0.6) 100%)`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${event.color}22`;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = event.color + '33';
                (e.currentTarget as HTMLElement).style.background =
                  `linear-gradient(135deg, ${event.color}0a 0%, rgba(13,20,36,0.6) 100%)`;
                (e.currentTarget as HTMLElement).style.transform = 'none';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Loading shimmer */}
              {isLoading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(90deg, transparent 0%, ${event.color}22 50%, transparent 100%)`,
                  animation: 'shimmer 1.5s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{event.icon}</span>
                {isLoading && (
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: `2px solid ${event.color}44`,
                    borderTopColor: event.color,
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0,
                  }} />
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 12, color: event.color }}>
                {isLoading ? 'Submitting...' : event.label}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.3 }}>
                {event.description.substring(0, 55)}...
              </div>
            </button>
          );
        })}
      </div>

      {/* Success message */}
      {lastResult && (
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          color: '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fade-in 0.3s ease',
        }}>
          <span>✓</span>
          <span>
            <strong>{lastResult.label}</strong> submitted as Observation #{lastResult.obsId} — agents are voting
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          color: '#fca5a5',
          animation: 'fade-in 0.3s ease',
        }}>
          ⚠️ {error}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
