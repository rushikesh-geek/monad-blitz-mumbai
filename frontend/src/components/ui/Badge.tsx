import type { CSSProperties, ReactNode } from 'react';
import { theme } from '../../theme/theme';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

const tones: Record<Tone, CSSProperties> = {
  neutral: {
    background: theme.colors.status.neutralMuted,
    color: theme.colors.text.secondary,
  },
  success: {
    background: theme.colors.status.successMuted,
    color: theme.colors.status.success,
  },
  warning: {
    background: theme.colors.status.warningMuted,
    color: theme.colors.status.warning,
  },
  danger: {
    background: theme.colors.status.dangerMuted,
    color: theme.colors.status.danger,
  },
  brand: {
    background: theme.colors.brand.primaryMuted,
    color: theme.colors.brand.primary,
  },
};

export default function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: theme.radius.full,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.medium,
        lineHeight: 1.4,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}
