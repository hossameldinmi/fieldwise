'use client';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';

interface Props { lat: number; lng: number; onPick: (lat: number, lng: number) => void }

function ClickHandler({ onPick }: { onPick: Props['onPick'] }) {
  useMapEvents({ click: (e) => onPick(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))) });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getBounds().contains([lat, lng])) map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({ lat, lng, onPick }: Props) {
  return (
    <MapContainer center={[lat, lng]} zoom={8} className="h-64 w-full rounded-md border border-line" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: '#2E6B3C', weight: 3, fillColor: '#2E6B3C', fillOpacity: 0.35 }} />
      <ClickHandler onPick={onPick} />
      <Recenter lat={lat} lng={lng} />
    </MapContainer>
  );
}
