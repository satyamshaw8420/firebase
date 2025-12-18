import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { getDestinationDetails } from '../services/geminiService';
import { getUserTrips } from '../firebase/tripService';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, MapPin, ExternalLink, X, Calendar, CheckCircle, Clock } from 'lucide-react';
import { SavedTrip } from '../types';
import { ItineraryView } from '../components/ItineraryView';

// Helper to estimate coordinates (Mocking a geocoding service for demo)
const CITY_COORDINATES: Record<string, { lat: number, lng: number }> = {
    "Paris": { lat: 48.8566, lng: 2.3522 },
    "New York": { lat: 40.7128, lng: -74.0060 },
    "London": { lat: 51.5074, lng: -0.1278 },
    "Tokyo": { lat: 35.6762, lng: 139.6503 },
    "Dubai": { lat: 25.2048, lng: 55.2708 },
    "Singapore": { lat: 1.3521, lng: 103.8198 },
    "Bali": { lat: -8.4095, lng: 115.1889 },
    "Sydney": { lat: -33.8688, lng: 151.2093 },
    "Mumbai": { lat: 19.0760, lng: 72.8777 },
    "Delhi": { lat: 28.7041, lng: 77.1025 },
    "Bangalore": { lat: 12.9716, lng: 77.5946 },
    "Kashmir": { lat: 34.0837, lng: 74.7973 },
    "Goa": { lat: 15.2993, lng: 74.1240 },
    "Rome": { lat: 41.9028, lng: 12.4964 },
    "Kyoto": { lat: 35.0116, lng: 135.7681 },
    "Istanbul": { lat: 41.0082, lng: 28.9784 },
    "Bangkok": { lat: 13.7563, lng: 100.5018 },
    "Santorini": { lat: 36.3932, lng: 25.4615 },
    "Maldives": { lat: 3.2028, lng: 73.2207 },
    "Swiss Alps": { lat: 46.5600, lng: 8.0200 },
    "Kolkata": { lat: 22.5726, lng: 88.3639 },
    "Jaipur": { lat: 26.9124, lng: 75.7873 },
    "Manali": { lat: 32.2432, lng: 77.1892 },
    "Kerala": { lat: 10.8505, lng: 76.2711 },
    "Chennai": { lat: 13.0827, lng: 80.2707 },
    "Hyderabad": { lat: 17.3850, lng: 78.4867 },
    "Pune": { lat: 18.5204, lng: 73.8567 },
    "Puri": { lat: 19.8135, lng: 85.8312 },
    "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
    "Varanasi": { lat: 25.3176, lng: 82.9739 },
    "Ladakh": { lat: 34.1526, lng: 77.5770 },
    "Seoul": { lat: 37.5665, lng: 126.9780 },
    "Barcelona": { lat: 41.3851, lng: 2.1734 },
    "Amsterdam": { lat: 52.3676, lng: 4.9041 },
    "Los Angeles": { lat: 34.0522, lng: -118.2437 },
    "San Francisco": { lat: 37.7749, lng: -122.4194 },
    "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
    "Cape Town": { lat: -33.9249, lng: 18.4241 },
    "Cairo": { lat: 30.0444, lng: 31.2357 }
};

const getCoordinates = (location: string) => {
    // Simple partial match logic
    const city = Object.keys(CITY_COORDINATES).find(c => location.toLowerCase().includes(c.toLowerCase()));
    if (city) return CITY_COORDINATES[city];
    
    // Random fallback around India for demo purposes if unknown
    // In production, use a real Geocoding API
    return { lat: 20 + Math.random() * 10, lng: 77 + Math.random() * 10 };
};

const Destination: React.FC = () => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ text: string, sources: any[] } | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [ringsData, setRingsData] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const globeEl = useRef<any>(null);

  useEffect(() => {
    // Load trips from Firebase
    const loadTrips = async () => {
      if (currentUser) {
        try {
          const userTrips = await getUserTrips(currentUser.uid);
          setTrips(userTrips);

          const now = new Date();
          const points = userTrips.map(trip => {
              const coords = getCoordinates(trip.preferences.destination);
              const endDate = new Date(trip.preferences.endDate);
              const isCompleted = endDate < now;

              return {
                  lat: coords.lat,
                  lng: coords.lng,
                  label: trip.tripName,
                  color: isCompleted ? '#4ade80' : '#f43f5e', // Green for done, Red for planned
                  status: isCompleted ? 'Completed' : 'Planned',
                  tripData: trip
              };
          });

          setPointsData(points);
          // Only show pulsating rings for upcoming/planned trips
          setRingsData(points.filter(p => p.status === 'Planned'));
        } catch (error) {
          console.error('Error loading trips:', error);
        }
      }
    };

    loadTrips();
  }, [currentUser]);

  // Implement continuous rotation for the globe
  useEffect(() => {
    if (globeEl.current) {
      // Set initial rotation speed
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const result = await getDestinationDetails(query);
      setData(result);
    } catch (error) {
      console.error(error);
      alert("Could not fetch destination details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePointClick = (point: any) => {
      setSelectedTrip(point.tripData);
      
      // Aim globe at point
      if (globeEl.current) {
          globeEl.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.5 }, 1000);
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col relative overflow-hidden">
      
      {/* 3D Globe Section */}
      <div className="absolute inset-0 z-0">
          <Globe
            ref={globeEl}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            pointsData={pointsData}
            pointAltitude={0.05}
            pointColor="color"
            pointRadius={0.5}
            pointsMerge={true}
            ringsData={ringsData}
            ringColor={() => '#f43f5e'}
            ringMaxRadius={5}
            ringPropagationSpeed={2}
            ringRepeatPeriod={1000}
            labelsData={pointsData}
            labelLat={(d: any) => d.lat}
            labelLng={(d: any) => d.lng}
            labelText={(d: any) => d.label}
            labelSize={1.5}
            labelDotRadius={0.5}
            labelColor={() => 'rgba(255, 255, 255, 0.75)'}
            labelResolution={2}
            onPointClick={handlePointClick}
            onLabelClick={handlePointClick}
            animateIn={true}
            enablePointerInteraction={true}
          />
      </div>

      {/* UI Overlay - Legend */}
      <div className="absolute top-24 right-4 z-10 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-gray-700">
          <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Your Map Legend</h3>
          <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse"></span>
                  <span className="text-sm font-medium">Planned Trips (Ping)</span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-400"></span>
                  <span className="text-sm font-medium">Completed Trips</span>
              </div>
          </div>
      </div>

      {/* Search Bar - Floating */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
        <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-2xl p-2 flex items-center transition-all focus-within:bg-white/20 focus-within:border-white/40">
            <MapPin className="text-emerald-400 ml-4 w-5 h-5" />
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any destination to explore..."
                className="flex-grow p-3 bg-transparent text-white placeholder-gray-300 focus:outline-none text-lg font-medium"
            />
            <button 
                type="submit" 
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full transition-colors disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
        </form>
      </div>

      {/* Selected Trip Details Overlay */}
      {selectedTrip && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl">
                  <button 
                    onClick={() => setSelectedTrip(null)}
                    className="absolute top-4 right-4 z-[60] bg-white text-gray-900 p-2 rounded-full hover:bg-gray-200 shadow-lg"
                  >
                      <X className="w-6 h-6" />
                  </button>
                  <ItineraryView itinerary={selectedTrip} onClose={() => setSelectedTrip(null)} closeLabel="Close Details" />
              </div>
          </div>
      )}

      {/* Search Result Overlay (Bottom Panel) */}
      {data && !selectedTrip && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gray-900/90 backdrop-blur-lg border-t border-gray-700 max-h-[50vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
              <div className="max-w-4xl mx-auto px-4 py-8 relative">
                <button 
                    onClick={() => setData(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <MapPin className="w-6 h-6" /> {query}
                </h2>
                <div className="prose prose-invert max-w-none mb-6 whitespace-pre-wrap leading-relaxed text-gray-300 text-sm md:text-base">
                    {data.text}
                </div>

                {data.sources.length > 0 && (
                    <div className="grid gap-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sources</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.sources.map((chunk, idx) => (
                                chunk.web?.uri ? (
                                    <a 
                                        key={idx} 
                                        href={chunk.web.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors border border-gray-700 text-xs text-emerald-400"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{chunk.web.title}</span>
                                    </a>
                                ) : null
                            ))}
                        </div>
                    </div>
                )}
              </div>
          </div>
      )}

      {!data && !selectedTrip && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 text-center pointer-events-none">
              <p className="text-gray-400 text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur">
                  Spin the globe to view your journey map. Click points for details.
              </p>
          </div>
      )}
    </div>
  );
};

export default Destination;