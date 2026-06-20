import type { CSSProperties, ReactNode } from 'react';
import { theme } from '../../theme/theme';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  padding?: keyof typeof theme.spacing;
}

export default function Card({ children, style, padding = 4 }: CardProps) {
  return (
    <div
      style={{
        background: theme.colors.bg.surface,
        border: `1px solid ${theme.colors.border.default}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing[padding],
        boxShadow: theme.shadow.sm,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
