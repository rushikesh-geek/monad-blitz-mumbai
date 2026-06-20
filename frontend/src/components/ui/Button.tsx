import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { theme } from '../../theme/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variants: Record<Variant, CSSProperties> = {
  primary: {
    background: theme.colors.brand.primary,
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: theme.colors.bg.elevated,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.strong}`,
  },
  ghost: {
    background: 'transparent',
    color: theme.colors.text.secondary,
    border: `1px solid ${theme.colors.border.default}`,
  },
};

export default function Button({
  variant = 'primary',
  fullWidth,
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
        padding: `${theme.spacing[2]}px ${theme.spacing[4]}px`,
        borderRadius: theme.radius.md,
        fontFamily: theme.font.sans,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'background 0.15s ease, border-color 0.15s ease',
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
