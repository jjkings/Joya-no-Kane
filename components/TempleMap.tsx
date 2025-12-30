
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Temple } from '../types';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface TempleMapProps {
  temples: Temple[];
  onSelectTemple: (temple: Temple) => void;
  onSearchArea: (lat: number, lng: number) => void;
  isSearching: boolean;
}

const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
};

const MapController: React.FC<{ setCenter: (lat: number, lng: number) => void }> = ({ setCenter }) => {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      setCenter(center.lat, center.lng);
    }
  });
  return null;
};

const TempleMap: React.FC<TempleMapProps> = ({ temples, onSelectTemple, onSearchArea, isSearching }) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.0, 138.0]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        }
      );
    }
  }, []);

  return (
    <div className="w-full h-full relative border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
      <MapContainer center={mapCenter} zoom={6} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController setCenter={(lat, lng) => setMapCenter([lat, lng])} />
        {temples.map((temple) => (
          <Marker key={temple.id} position={temple.location}>
            <Popup>
              <div className="p-2 text-gray-900">
                <h3 className="font-bold text-lg border-b mb-1">{temple.name}</h3>
                <p className="text-xs mb-2 text-gray-600">{temple.address}</p>
                <button
                  onClick={() => onSelectTemple(temple)}
                  className="w-full bg-red-800 text-white py-1.5 rounded font-bold hover:bg-red-700 transition-colors text-sm"
                >
                  このお寺へ参拝する
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        {userLocation && <MapRecenter center={userLocation} />}
      </MapContainer>
      
      {/* Floating Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 pointer-events-none">
        <button
          onClick={() => onSearchArea(mapCenter[0], mapCenter[1])}
          disabled={isSearching}
          className="pointer-events-auto bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white px-6 py-2 rounded-full font-bold shadow-xl border-2 border-amber-400/50 transition-all flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              お寺を探索中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              このエリアのお寺を検索
            </>
          )}
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] bg-black/60 backdrop-blur-md p-3 rounded-lg border border-gray-600 max-w-xs pointer-events-none">
        <h2 className="text-sm font-bold text-red-500 mb-1">参拝先を選びましょう</h2>
        <p className="text-[10px] text-gray-300">マップを移動して「検索」ボタンを押すと、近くのお寺が見つかります。</p>
      </div>
    </div>
  );
};

export default TempleMap;
