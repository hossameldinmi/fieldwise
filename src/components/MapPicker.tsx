'use client';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';

interface Props { lat: number; lng: number; onPick: (lat: number, lng: number) => void }

function ClickHandler({ onPick }: { onPick: Props['onPick'] }) {
  useMapEvents({ click: (e) => onPick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4))) });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng) && !map.getBounds().contains([lat, lng])) map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({ lat, lng, onPick }: Props) {
  const ok = Number.isFinite(lat) && Number.isFinite(lng);
  return (
    <MapContainer center={ok ? [lat, lng] : [30.8, 31.0]} zoom={7} className="h-[340px] w-full cursor-crosshair" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        // OSM rejects tile requests without a Referer; proxies such as dev tunnels send `Referrer-Policy: same-origin`.
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {ok && <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: '#15201B', weight: 3, fillColor: '#1D6B47', fillOpacity: 0.45 }} />}
      <ClickHandler onPick={onPick} />
      <Recenter lat={lat} lng={lng} />
    </MapContainer>
  );
}
