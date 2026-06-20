/** Proof of Reality — brand palette (original, not cloned from third-party products) */
export const colors = {
  bg: {
    base: '#09090b',
    surface: '#18181b',
    elevated: '#1f1f23',
    muted: '#27272a',
  },
  border: {
    default: '#27272a',
    strong: '#3f3f46',
    focus: '#6366f1',
  },
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    muted: '#71717a',
    inverse: '#09090b',
  },
  brand: {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryMuted: 'rgba(99, 102, 241, 0.12)',
  },
  status: {
    success: '#22c55e',
    successMuted: 'rgba(34, 197, 94, 0.12)',
    warning: '#eab308',
    warningMuted: 'rgba(234, 179, 8, 0.12)',
    danger: '#ef4444',
    dangerMuted: 'rgba(239, 68, 68, 0.12)',
    neutral: '#71717a',
    neutralMuted: 'rgba(113, 113, 122, 0.12)',
  },
  agent: {
    flood: '#0ea5e9',
    grid: '#f97316',
    crowd: '#22c55e',
    skeptic: '#8b5cf6',
  },
} as const;

export type Colors = typeof colors;
