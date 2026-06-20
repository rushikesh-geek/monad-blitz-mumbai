import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Observation } from '../api';

interface Props {
  observations: Observation[];
  onSelectObservation?: (obs: Observation) => void;
}

function statusColor(obs: Observation): string {
  if (!obs.finalized) {
    return obs.voteCount > 0 ? '#f59e0b' : '#64748b'; // yellow=voting, grey=pending
  }
  return obs.status === 1 ? '#10b981' : '#ef4444'; // green=confirmed, red=disputed
}

function statusLabel(obs: Observation): string {
  if (!obs.finalized) return obs.voteCount > 0 ? 'VOTING' : 'PENDING';
  return obs.status === 1 ? 'CONFIRMED' : 'DISPUTED';
}

function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="
        width: 16px; height: 16px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.4);
        box-shadow: 0 0 12px ${color}99, 0 0 4px ${color};
        position: relative;
      ">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid ${color}44;
          animation: ping 2s ease-in-out infinite;
        "></div>
      </div>
      <style>
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
    className: '',
  });
}

export default function LiveMap({ observations, onSelectObservation }: Props) {
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      opacity: 0.9,
    }).addTo(mapRef.current);

    // Attribution (minimal)
    L.control.attribution({ prefix: false }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when observations change
  useEffect(() => {
    if (!mapRef.current) return;

    const currentIds = new Set(observations.map((o) => o.id));

    // Remove stale markers
    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    // Add/update markers
    for (const obs of observations) {
      const color = statusColor(obs);
      const label = statusLabel(obs);
      const confidence = obs.confidenceBps / 100;

      const popupHTML = `
        <div style="font-family: Inter, sans-serif; min-width: 220px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};flex-shrink:0"></div>
            <span style="font-weight:700;font-size:13px;color:${color};">${label}</span>
            <span style="margin-left:auto;font-size:11px;color:#94a3b8;">ID #${obs.id}</span>
          </div>
          <div style="font-size:12px;font-weight:600;color:#a78bfa;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${obs.claimType}</div>
          <div style="font-size:13px;color:#e2e8f0;margin-bottom:10px;line-height:1.4;">${obs.description}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
            <div style="background:rgba(255,255,255,0.05);padding:6px 8px;border-radius:6px;">
              <div style="color:#64748b;margin-bottom:2px;">Votes</div>
              <div style="color:#f1f5f9;font-weight:600;">${obs.voteCount}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);padding:6px 8px;border-radius:6px;">
              <div style="color:#64748b;margin-bottom:2px;">Confidence</div>
              <div style="color:#f1f5f9;font-weight:600;">${obs.finalized ? confidence.toFixed(1) + '%' : '—'}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);padding:6px 8px;border-radius:6px;">
              <div style="color:#64748b;margin-bottom:2px;">Confirm</div>
              <div style="color:#10b981;font-weight:600;">${obs.confirmStake} MON</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);padding:6px 8px;border-radius:6px;">
              <div style="color:#64748b;margin-bottom:2px;">Dispute</div>
              <div style="color:#ef4444;font-weight:600;">${obs.disputeStake} MON</div>
            </div>
          </div>
          <button onclick="window.__porInspect && window.__porInspect('${obs.id}')" style="
            margin-top:10px;width:100%;padding:8px;border-radius:8px;border:1px solid rgba(124,58,237,0.4);
            background:rgba(124,58,237,0.15);color:#a78bfa;font-weight:700;font-size:12px;cursor:pointer;
          ">🔍 Inspect Observation</button>
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

  // Expose inspect handler for popup button
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
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(13, 20, 36, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(100,120,200,0.2)',
        borderRadius: 10,
        padding: '10px 14px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {[
          { color: '#64748b', label: 'Pending' },
          { color: '#f59e0b', label: 'Voting' },
          { color: '#10b981', label: 'Confirmed' },
          { color: '#ef4444', label: 'Disputed' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
