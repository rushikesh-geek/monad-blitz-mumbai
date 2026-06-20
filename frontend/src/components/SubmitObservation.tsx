import { useState } from 'react';
import { simulate } from '../api';
import { theme } from '../theme/theme';
import { Button } from './ui';

const EVENTS = [
  {
    label: 'Flood · Andheri',
    claimType: 'flood',
    description: 'Severe waterlogging on SV Road near Andheri station.',
    lat: 19.1136,
    lng: 72.8697,
  },
  {
    label: 'Outage · Bandra',
    claimType: 'power_outage',
    description: 'Power failure across Bandra West affecting Hill Road.',
    lat: 19.0596,
    lng: 72.8295,
  },
  {
    label: 'Traffic · Dadar',
    claimType: 'traffic',
    description: 'Major congestion at Dadar TT circle on Eastern Express Highway.',
    lat: 19.0178,
    lng: 72.8478,
  },
] as const;

interface Props {
  onSubmitted?: () => void;
  disabled?: boolean;
}

export default function SubmitObservation({ onSubmitted, disabled }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: (typeof EVENTS)[number]) => {
    if (loading || disabled) return;
    setLoading(event.label);
    setError(null);
    try {
      await simulate({
        claimType: event.claimType,
        description: event.description,
        lat: event.lat,
        lng: event.lng,
      });
      onSubmitted?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      <p style={{ margin: 0, fontSize: theme.fontSize.xs, color: theme.colors.text.muted, lineHeight: 1.45 }}>
        Submit an observation to the network. Agents will analyze and vote autonomously.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
        {EVENTS.map((event) => (
          <Button
            key={event.label}
            variant="secondary"
            fullWidth
            disabled={!!loading || disabled}
            onClick={() => submit(event)}
            style={{ justifyContent: 'flex-start', textAlign: 'left' }}
          >
            {loading === event.label ? 'Submitting…' : event.label}
          </Button>
        ))}
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: theme.fontSize.xs, color: theme.colors.status.danger }}>{error}</p>
      )}
    </div>
  );
}
