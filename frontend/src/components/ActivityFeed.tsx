import { useEffect, useRef } from 'react';
import type { SSEEvent } from '../api';

export interface FeedEntry {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  color: string;
  icon: string;
}

interface Props {
  entries: FeedEntry[];
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function sseEventToFeedEntry(event: SSEEvent): FeedEntry | null {
  const id = `${Date.now()}-${Math.random()}`;
  const timestamp = Date.now();

  switch (event.type) {
    case 'observation_submitted':
      return {
        id,
        timestamp,
        type: 'observation',
        message: `New observation #${event.obsId}: ${event.claimType.toUpperCase()} — ${event.description.substring(0, 50)}`,
        color: '#a78bfa',
        icon: '📡',
      };
    case 'vote':
      return {
        id,
        timestamp,
        type: 'vote',
        message: `${event.agent} ${event.action} | ${event.stake} MON | ${event.confidence}% conf — "${event.reasoning?.substring(0, 40)}"`,
        color: event.action === 'CONFIRM' ? '#10b981' : '#ef4444',
        icon: event.action === 'CONFIRM' ? '✅' : '❌',
      };
    case 'finalized': {
      const bps = Math.round(event.confidenceBps / 100);
      return {
        id,
        timestamp,
        type: 'consensus',
        message: `Consensus #${event.obsId}: ${event.result} — ${bps}% confidence`,
        color: event.result === 'CONFIRMED' ? '#10b981' : '#ef4444',
        icon: event.result === 'CONFIRMED' ? '🏆' : '⚠️',
      };
    }
    default:
      return null;
  }
}

export default function ActivityFeed({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '2px 4px 2px 2px',
      }}
    >
      {entries.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 10,
          color: '#475569',
        }}>
          <div style={{ fontSize: 28 }}>📡</div>
          <div style={{ fontSize: 13 }}>Waiting for events...</div>
          <div style={{ fontSize: 11, color: '#334155' }}>Click a button to simulate an event</div>
        </div>
      )}

      {entries.map((entry, i) => (
        <div
          key={entry.id}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `2px solid ${entry.color}66`,
            animation: 'fade-in 0.3s ease',
            animationFillMode: 'both',
            animationDelay: `${Math.min(i * 0.02, 0.1)}s`,
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0 }}>{entry.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11,
              color: '#94a3b8',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}>
              <span style={{ color: entry.color, fontWeight: 600 }}>
                {entry.type.toUpperCase()}{' '}
              </span>
              {entry.message}
            </div>
          </div>
          <div style={{
            fontSize: 10,
            color: '#334155',
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
            paddingTop: 1,
          }}>
            {timeAgo(entry.timestamp)}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
