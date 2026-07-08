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

const assignedIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;background:#22C55E;border:3px solid #F8FAFC;border-radius:50%;box-shadow:0 0 16px rgba(34,197,94,0.8);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function DistancesList({ allDistances, candidate, nearest, onAssignAssemblyPoint }) {
  return (
    <div className="border-t border-[rgba(123,63,191,0.15)] max-h-[300px] overflow-y-auto p-4">
      <div className="text-xs font-bold text-[#F8FAFC]/35 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Navigation size={12} /> Расстояния до точек сбора
      </div>
      <div className="space-y-1.5">
        {allDistances.map((d) => {
          const isAssigned = candidate.assembly_point === d.name;
          const isNearest = nearest && d.name === nearest.point.name;
          return (
            <div
              key={d.name}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border ${
                isAssigned ? 'bg-green-500/10 border-green-500/25'
                : isNearest ? 'bg-[#C9A84C]/10 border-[#C9A84C]/25'
                : 'border-transparent hover:bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isAssigned ? 'bg-green-400'
                  : isNearest ? 'bg-[#C9A84C]'
                  : 'bg-[#F8FAFC]/20'
                }`} />
                <div className="min-w-0">
                  <span className={`${
                    isAssigned ? 'text-green-400 font-medium'
                    : isNearest ? 'text-[#C9A84C] font-medium'
                    : 'text-[#F8FAFC]/70'
                  }`}>{d.name}</span>
                  {d.region && <span className="text-xs text-[#F8FAFC]/30 ml-2">{d.region}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-bold ${
                  isAssigned ? 'text-green-400'
                  : isNearest ? 'text-[#C9A84C]'
                  : 'text-[#F8FAFC]/60'
                }`}>
                  {formatDistance(d.distance)}
                </span>
                {onAssignAssemblyPoint && (
                  <button
                    onClick={() => onAssignAssemblyPoint(d.name, d.distance)}
                    className={`text-xs px-2 py-1 rounded border transition-all ${
                      isAssigned
                        ? 'bg-green-500/15 border-green-500/30 text-green-400 cursor-default'
                        : 'border-[rgba(123,63,191,0.3)] text-[#7B3FBF] hover:bg-[rgba(123,63,191,0.1)]'
                    }`}
                    disabled={isAssigned}
                  >
                    {isAssigned ? '✓ Назначена' : 'Назначить'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CandidateMapDrawer({ candidate, cityCache, onClose, onAssignAssemblyPoint }) {
  const candidateCity = candidate?.city ? cityCache[candidate.city.toLowerCase()] : null;
  const hasCoords = candidateCity?.lat != null && candidateCity?.lon != null;

  const assemblyPoints = useMemo(
    () => Object.values(cityCache).filter(c => c.is_assembly_point),
    [cityCache]
  );

  const nearest = useMemo(() => {
    if (!hasCoords) return null;
    const withCoords = assemblyPoints.filter(ap => ap.lat != null && ap.lon != null);
    return findNearestAssemblyPoint(candidateCity.lat, candidateCity.lon, withCoords);
  }, [hasCoords, candidateCity, assemblyPoints]);

  const allDistances = useMemo(() => {
    if (!hasCoords) {
      return assemblyPoints
        .map(ap => ({ name: ap.name, region: ap.region, distance: null }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }
    return assemblyPoints
      .map(ap => ({
        name: ap.name,
        region: ap.region,
        distance: haversineDistance(candidateCity.lat, candidateCity.lon, ap.lat, ap.lon),
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [hasCoords, candidateCity, assemblyPoints]);

  if (!candidate) return null;

  const mapAssemblyPoints = assemblyPoints.filter(ap => ap.lat != null && ap.lon != null);

  return (
    <div className="fixed inset-0 z-[200] flex items-stretch justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#05070A] border-l border-[rgba(123,63,191,0.2)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(123,63,191,0.15)]">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={16} className="text-[#C9A84C] flex-shrink-0" />
            <h2 className="text-sm font-bold text-[#F8FAFC] truncate">{candidate.full_name}</h2>
            <span className="text-xs text-[#F8FAFC]/35 truncate">— {candidate.city || 'город не указан'}</span>
            {candidate.assembly_point && (
              <span className="text-xs text-green-400 truncate ml-1">→ {candidate.assembly_point}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#F8FAFC]/50 hover:text-[#F8FAFC] flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {!hasCoords ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <MapPin size={32} className="mx-auto text-[#F8FAFC]/20 mb-3" />
                <p className="text-sm text-[#F8FAFC]/40 max-w-sm">
                  {candidate.city
                    ? `Город «${candidate.city}» не найден в справочнике или у него нет координат. Расстояния не могут быть рассчитаны, но точку сбора можно назначить вручную.`
                    : 'У кандидата не указан город. Расстояния не могут быть рассчитаны, но точку сбора можно назначить вручную.'}
                </p>
              </div>
            </div>
            <DistancesList
              allDistances={allDistances}
              candidate={candidate}
              nearest={nearest}
              onAssignAssemblyPoint={onAssignAssemblyPoint}
            />
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
                {mapAssemblyPoints.map(ap => {
                  const isAssigned = candidate.assembly_point === ap.name;
                  return (
                    <Marker key={ap.id} position={[ap.lat, ap.lon]} icon={isAssigned ? assignedIcon : assemblyIcon}>
                      <Popup>{ap.name}{isAssigned ? ' — назначенная точка' : ''}</Popup>
                    </Marker>
                  );
                })}
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

            <DistancesList
              allDistances={allDistances}
              candidate={candidate}
              nearest={nearest}
              onAssignAssemblyPoint={onAssignAssemblyPoint}
            />
          </>
        )}
      </div>
    </div>
  );
}