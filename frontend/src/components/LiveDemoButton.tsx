import { useState, useEffect } from 'react';
import { simulate } from '../api';
import type { StoryStep } from './StoryTimeline';

interface Props {
  onDemoStart: () => void;
  onDemoStep: (step: StoryStep) => void;
  disabled?: boolean;
  onRunningChange?: (running: boolean) => void;
}

const FLOOD_EVENT = {
  claimType: 'flood',
  description: 'Severe waterlogging reported on SV Road near Andheri station. Knee-deep water blocking traffic.',
  lat: 19.1136,
  lng: 72.8697,
};

export default function LiveDemoButton({ onDemoStart, onDemoStep, disabled, onRunningChange }: Props) {
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    if (running || disabled) return;
    setRunning(true);
    onRunningChange?.(true);
    onDemoStart();
    onDemoStep('submitted');

    try {
      await simulate(FLOOD_EVENT);
      onDemoStep('analyzing');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Demo failed';
      console.error(msg);
      setRunning(false);
      onRunningChange?.(false);
    }
  };

  // Sync running state when parent disables after demo completes
  useEffect(() => {
    if (disabled && running) setRunning(false);
  }, [disabled, running]);

  return (
    <button
      id="run-live-demo"
      onClick={handleRun}
      disabled={running || disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        padding: '14px 20px',
        borderRadius: 12,
        border: 'none',
        background: running
          ? 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(6,182,212,0.3))'
          : 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        color: 'white',
        fontWeight: 800,
        fontSize: 14,
        cursor: running || disabled ? 'not-allowed' : 'pointer',
        boxShadow: running
          ? '0 0 20px rgba(124,58,237,0.3)'
          : '0 4px 24px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2)',
        transition: 'all 0.2s ease',
        letterSpacing: '0.02em',
        opacity: disabled ? 0.6 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!running && !disabled) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 8px 32px rgba(124,58,237,0.6), 0 0 50px rgba(124,58,237,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'none';
        if (!running) {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 4px 24px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2)';
        }
      }}
    >
      {running && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
          animation: 'shimmer 1.5s ease-in-out infinite',
        }} />
      )}
      <span style={{ fontSize: 18 }}>{running ? '⏳' : '▶'}</span>
      <span>{running ? 'Demo Running...' : 'Run Live Demo'}</span>
      {!running && (
        <span style={{
          fontSize: 9,
          padding: '2px 6px',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.2)',
          fontWeight: 700,
        }}>
          15s
        </span>
      )}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </button>
  );
}
