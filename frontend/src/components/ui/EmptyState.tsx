import type { ReactNode } from 'react';
import { theme } from '../../theme/theme';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: theme.spacing[8],
        gap: theme.spacing[3],
        color: theme.colors.text.muted,
      }}
    >
      <div style={{ fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text.secondary }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: theme.fontSize.sm, maxWidth: 360, lineHeight: 1.5 }}>{description}</div>
      )}
      {action}
    </div>
  );
}
