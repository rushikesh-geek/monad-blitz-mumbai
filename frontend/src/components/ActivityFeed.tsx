import { useEffect, useRef } from 'react';
import type { SSEEvent } from '../api';
import { theme } from '../theme/theme';
import EmptyState from './ui/EmptyState';

export interface FeedEntry {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  tone: 'brand' | 'success' | 'danger' | 'neutral';
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

// eslint-disable-next-line react-refresh/only-export-components
export function sseEventToFeedEntry(event: SSEEvent): FeedEntry | null {
  const id = `${Date.now()}-${Math.random()}`;
  const timestamp = Date.now();

  switch (event.type) {
    case 'observation_submitted':
      return {
        id,
        timestamp,
        type: 'Observation',
        message: `#${event.obsId} · ${event.claimType.replace(/_/g, ' ')} — ${event.description.substring(0, 60)}`,
        tone: 'brand',
      };
    case 'vote':
      return {
        id,
        timestamp,
        type: 'Vote',
        message: `${event.agent} · ${event.action} · ${event.stake} MON`,
        tone: event.action === 'CONFIRM' ? 'success' : 'danger',
      };
    case 'finalized':
      return {
        id,
        timestamp,
        type: 'Consensus',
        message: `#${event.obsId} · ${event.result} · ${Math.round(event.confidenceBps / 100)}% confidence`,
        tone: event.result === 'CONFIRMED' ? 'success' : 'danger',
      };
    default:
      return null;
  }
}

const toneColor = {
  brand: theme.colors.brand.primary,
  success: theme.colors.status.success,
  danger: theme.colors.status.danger,
  neutral: theme.colors.text.muted,
};

export default function ActivityFeed({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Network events will appear here as observations are verified."
      />
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing[2],
        padding: theme.spacing[2],
      }}
    >
      {entries.slice().reverse().map((entry) => (
        <div
          key={entry.id}
          style={{
            padding: theme.spacing[3],
            borderRadius: theme.radius.md,
            background: theme.colors.bg.elevated,
            border: `1px solid ${theme.colors.border.default}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: theme.spacing[2], marginBottom: 4 }}>
            <span style={{ fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, color: toneColor[entry.tone] }}>
              {entry.type}
            </span>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.text.muted, fontFamily: theme.font.mono }}>
              {timeAgo(entry.timestamp)}
            </span>
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.secondary, lineHeight: 1.45, wordBreak: 'break-word' }}>
            {entry.message}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
