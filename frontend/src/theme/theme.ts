export { colors } from './colors';
export { tokens, spacing, radius, fontWeight, fontSize, shadow, layout } from './tokens';

import { colors } from './colors';
import { spacing, radius, fontWeight, fontSize, shadow, layout } from './tokens';

export const theme = {
  colors,
  spacing,
  radius,
  fontWeight,
  fontSize,
  shadow,
  layout,
  font: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
} as const;

export type Theme = typeof theme;

/** Agent persona → accent color */
export const agentColor = (persona: string): string => {
  if (persona.includes('Flood')) return colors.agent.flood;
  if (persona.includes('Grid')) return colors.agent.grid;
  if (persona.includes('Crowd')) return colors.agent.crowd;
  if (persona.includes('Skeptic')) return colors.agent.skeptic;
  return colors.brand.primary;
};

/** Observation status → semantic color */
export function observationStatusColor(finalized: boolean, status: number, voteCount: number): string {
  if (!finalized) return voteCount > 0 ? colors.status.warning : colors.status.neutral;
  return status === 1 ? colors.status.success : colors.status.danger;
}
