import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Navigation } from 'lucide-react';
import { haversineDistance, formatDistance, findNearestAssemblyPoint } from '@/lib/geoUtils';

const cityIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#7B3FBF;border:2px solid #F8FAFC;border-radius:50%;box-shadow:0 0 12px rgba(123,63,191,0.8);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const assemblyIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#C9A84C;border:2px solid #F8FAFC;border-radius:50%;box-shadow:0 0 12px rgba(201,168,76,0.8);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function CandidateMapDrawer({ candidate, cityCache, onClose }) {
  const candidateCity = candidate?.city ? cityCache[candidate.city.toLowerCase()] : null;
  const hasCoords = candidateCity?.lat != null && candidateCity?.lon != null;

  const assemblyPoints = useMemo(
    () => Object.values(cityCache).filter(c => c.is_assembly_point && c.lat != null && c.lon != null),
    [cityCache]
  );

  const nearest = useMemo(() => {
    if (!hasCoords) return null;
    return findNearestAssemblyPoint(candidateCity.lat, candidateCity.lon, assemblyPoints);
  }, [hasCoords, candidateCity, assemblyPoints]);

  const allDistances = useMemo(() => {
    if (!hasCoords) return [];
    return assemblyPoints
      .map(ap => ({
        name: ap.name,
        region: ap.region,
        distance: haversineDistance(candidateCity.lat, candidateCity.lon, ap.lat, ap.lon),
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [hasCoords, candidateCity, assemblyPoints]);

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#05070A] border-l border-[rgba(123,63,191,0.2)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(123,63,191,0.15)]">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={16} className="text-[#C9A84C] flex-shrink-0" />
            <h2 className="text-sm font-bold text-[#F8FAFC] truncate">{candidate.full_name}</h2>
            <span className="text-xs text-[#F8FAFC]/35 truncate">— {candidate.city}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#F8FAFC]/50 hover:text-[#F8FAFC] flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {!hasCoords ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <MapPin size={32} className="mx-auto text-[#F8FAFC]/20 mb-3" />
              <p className="text-sm text-[#F8FAFC]/40">
                Город «{candidate.city}» не найден в справочнике или у него нет координат.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Map */}
            <div className="flex-1 min-h-[300px] relative">
              <MapContainer
                center={[candidateCity.lat, candidateCity.lon]}
                zoom={5}
                className="w-full h-full"
                style={{ height: '100%', minHeight: '300px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                <Marker position={[candidateCity.lat, candidateCity.lon]} icon={cityIcon}>
                  <Popup>{candidate.city} — город кандидата</Popup>
                </Marker>
                {assemblyPoints.map(ap => (
                  <Marker key={ap.id} position={[ap.lat, ap.lon]} icon={assemblyIcon}>
                    <Popup>{ap.name}</Popup>
                  </Marker>
                ))}
                {nearest && (
                  <Polyline
                    positions={[
                      [candidateCity.lat, candidateCity.lon],
                      [nearest.point.lat, nearest.point.lon],
                    ]}
                    pathOptions={{ color: '#7B3FBF', dashArray: '6 6', weight: 2 }}
                  />
                )}
              </MapContainer>
            </div>

            {/* Distances list */}
            <div className="border-t border-[rgba(123,63,191,0.15)] max-h-[300px] overflow-y-auto p-4">
              <div className="text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Navigation size={12} /> Расстояния до точек сбора
              </div>
              <div className="space-y-1.5">
                {allDistances.map((d, i) => (
                  <div
                    key={d.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                      i === 0 ? 'bg-[#C9A84C]/10 border border-[#C9A84C]/25' : 'hover:bg-[rgba(255,255,255,0.03)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-[#C9A84C]' : 'bg-[#F8FAFC]/20'}`} />
                      <div className="min-w-0">
                        <span className={i === 0 ? 'text-[#C9A84C] font-medium' : 'text-[#F8FAFC]/70'}>{d.name}</span>
                        {d.region && <span className="text-xs text-[#F8FAFC]/30 ml-2">{d.region}</span>}
                      </div>
                    </div>
                    <span className={`font-bold flex-shrink-0 ${i === 0 ? 'text-[#C9A84C]' : 'text-[#F8FAFC]/60'}`}>
                      {formatDistance(d.distance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}