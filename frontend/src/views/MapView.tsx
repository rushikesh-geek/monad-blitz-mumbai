import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Observation } from '../api';
import { theme, observationStatusColor } from '../theme/theme';

interface Props {
  observations: Observation[];
  onSelectObservation?: (obs: Observation) => void;
}

function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid ${theme.colors.bg.surface};box-shadow:${theme.shadow.sm};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
    className: '',
  });
}

function statusLabel(obs: Observation): string {
  if (!obs.finalized) return obs.voteCount > 0 ? 'In consensus' : 'Pending';
  return obs.status === 1 ? 'Confirmed' : 'Disputed';
}

export default function MapView({ observations, onSelectObservation }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [19.076, 72.877],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const currentIds = new Set(observations.map((o) => o.id));

    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const obs of observations) {
      const color = observationStatusColor(obs.finalized, obs.status, obs.voteCount);
      const label = statusLabel(obs);
      const confidence = obs.confidenceBps / 100;

      const popupHTML = `
        <div style="font-family:Inter,sans-serif;min-width:220px;color:#18181b;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-weight:600;font-size:13px;color:${color};">${label}</span>
            <span style="margin-left:auto;font-size:11px;color:#71717a;">#${obs.id}</span>
          </div>
          <div style="font-size:12px;font-weight:500;text-transform:capitalize;margin-bottom:4px;">${obs.claimType.replace(/_/g, ' ')}</div>
          <div style="font-size:12px;color:#52525b;margin-bottom:10px;line-height:1.4;">${obs.description}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
            <div><span style="color:#71717a;">Votes</span><br/><strong>${obs.voteCount}/4</strong></div>
            <div><span style="color:#71717a;">Confidence</span><br/><strong>${obs.finalized ? confidence.toFixed(0) + '%' : '—'}</strong></div>
          </div>
          <button onclick="window.__porInspect && window.__porInspect('${obs.id}')" style="margin-top:10px;width:100%;padding:8px;border-radius:8px;border:1px solid #e4e4e7;background:#fafafa;font-weight:600;font-size:12px;cursor:pointer;">View details</button>
        </div>
      `;

      if (markersRef.current.has(obs.id)) {
        const marker = markersRef.current.get(obs.id)!;
        marker.setIcon(makeIcon(color));
        marker.getPopup()?.setContent(popupHTML);
      } else {
        const marker = L.marker([obs.lat, obs.lng], { icon: makeIcon(color) })
          .bindPopup(popupHTML, { maxWidth: 280 })
          .addTo(mapRef.current!);
        marker.on('click', () => onSelectObservation?.(obs));
        markersRef.current.set(obs.id, marker);
      }
    }
  }, [observations, onSelectObservation]);

  useEffect(() => {
    (window as unknown as { __porInspect?: (id: string) => void }).__porInspect = (id: string) => {
      const obs = observations.find((o) => o.id === id);
      if (obs) onSelectObservation?.(obs);
    };
    return () => {
      delete (window as unknown as { __porInspect?: (id: string) => void }).__porInspect;
    };
  }, [observations, onSelectObservation]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          bottom: theme.spacing[4],
          left: theme.spacing[4],
          background: theme.colors.bg.surface,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing[3],
          boxShadow: theme.shadow.md,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing[2],
        }}
      >
        {[
          { label: 'Pending', color: theme.colors.status.neutral },
          { label: 'In consensus', color: theme.colors.status.warning },
          { label: 'Confirmed', color: theme.colors.status.success },
          { label: 'Disputed', color: theme.colors.status.danger },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], fontSize: theme.fontSize.xs, color: theme.colors.text.secondary }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
