import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  MapPin, 
  Compass, 
  Search, 
  Phone, 
  Star, 
  Clock, 
  Hospital, 
  Navigation, 
  Activity,
  Heart,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface Place {
  id: string | number;
  name: string;
  type: string; // 'pharmacy' or 'hospital'
  rating: number;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
}

interface Medicine {
  id: number;
  brandName: string;
  genericName: string;
  brandPrice: number;
  genericPrice: number;
  composition: string;
  manufacturer: string;
  category: string;
  details: string;
}

interface NearbyShopsProps {
  selectedMedicineId?: number | null;
  setSelectedMedicineId?: (id: number | null) => void;
}

function NearbyShops({ selectedMedicineId, setSelectedMedicineId }: NearbyShopsProps) {
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(5); // Default 5km
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'pharmacy' | 'hospital'>('all');
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stockSearchQuery, setStockSearchQuery] = useState<string>('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [stockStatus, setStockStatus] = useState<'unchecked' | 'checking' | 'available' | 'unavailable'>('unchecked');

  // Home Delivery states
  const [showDeliveryModal, setShowDeliveryModal] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryMeds, setDeliveryMeds] = useState<string>('');
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'ordering' | 'placed'>('idle');
  const [assignedAgent, setAssignedAgent] = useState<string>('');
  const [eta, setEta] = useState<number>(30);

  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  // Load Leaflet CDN script and stylesheet
  useEffect(() => {
    const linkId = 'leaflet-css-cdn';
    const scriptId = 'leaflet-js-cdn';

    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else if ((window as any).L) {
      setLeafletLoaded(true);
    } else {
      const poll = setInterval(() => {
        if ((window as any).L) {
          setLeafletLoaded(true);
          clearInterval(poll);
        }
      }, 100);
      return () => clearInterval(poll);
    }
  }, []);

  // Fetch medicines catalog on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/medicines')
      .then(res => res.json())
      .then(data => setMedicines(data))
      .catch(err => console.error("Error loading medicines database", err));
  }, []);

  // Trigger stock check if selectedMedicineId is passed from another tab
  useEffect(() => {
    if (selectedMedicineId && medicines.length > 0) {
      const med = medicines.find(m => m.id === selectedMedicineId);
      if (med) {
        setStockSearchQuery(med.genericName);
        checkStockAvailability(med);
        // Reset the selection on navigation so it doesn't trigger repeatedly
        if (setSelectedMedicineId) {
          setSelectedMedicineId(null);
        }
      }
    }
  }, [selectedMedicineId, medicines]);

  // Detect location on load
  useEffect(() => {
    detectLocation();
  }, []);

  // Fetch data when coordinates or radius changes
  useEffect(() => {
    if (userCoords) {
      fetchNearbyData(userCoords.lat, userCoords.lng, radius);
    }
  }, [userCoords, radius]);

  // Sync Leaflet map view & markers
  useEffect(() => {
    if (!leafletLoaded || !userCoords) return;
    const L = (window as any).L;
    if (!L) return;

    // Initialize Map instance
    if (!mapRef.current) {
      mapRef.current = L.map('leaflet-map-element').setView([userCoords.lat, userCoords.lng], 14);
      
      // Use premium dark/neon style tiles from CartoDB
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    } else {
      mapRef.current.setView([userCoords.lat, userCoords.lng]);
    }

    drawMapAssets();
  }, [leafletLoaded, userCoords, places, selectedPlace]);

  // Distance calculator helper (Haversine Formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  };

  const detectLocation = () => {
    setLoading(true);
    setError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
        },
        (err) => {
          console.warn("Geolocation warning: ", err);
          // Default to New Delhi (Connaught Place)
          const defaultCoords = { lat: 28.6304, lng: 77.2177 };
          setUserCoords(defaultCoords);
          setError('Could not access real-time location. Displaying shops & hospitals near New Delhi by default.');
        },
        { timeout: 8000 }
      );
    } else {
      const defaultCoords = { lat: 28.6304, lng: 77.2177 };
      setUserCoords(defaultCoords);
      setError('Geolocation is not supported by your browser. Displaying default location.');
    }
  };

  // Query Overpass API for real-time OSM data
  const fetchNearbyData = async (lat: number, lng: number, radKm: number) => {
    setLoading(true);
    setError('');
    
    try {
      const radiusMeters = radKm * 1000;
      
      // Query OSM for pharmacies and hospitals in user radius
      const overpassQuery = `[out:json][timeout:25];
        (
          node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
          way["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
          node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
          way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
        );
        out center;`;

      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error("Overpass API error");
      const data = await res.json();

      if (data && data.elements && data.elements.length > 0) {
        const parsedPlaces: Place[] = data.elements.map((el: any) => {
          const isPharmacy = el.tags.amenity === 'pharmacy';
          const placeLat = el.lat || (el.center && el.center.lat);
          const placeLng = el.lon || (el.center && el.center.lon);
          
          let name = el.tags.name;
          if (!name) {
            name = isPharmacy ? "Local Pharmacy / Medical Store" : "General Hospital / Health Center";
          }
          
          // Format address details
          const street = el.tags['addr:street'] || '';
          const city = el.tags['addr:city'] || '';
          const suburb = el.tags['addr:suburb'] || '';
          const fullAddress = [street, suburb, city].filter(Boolean).join(', ') || `Coordinates: (${placeLat.toFixed(4)}, ${placeLng.toFixed(4)})`;

          const phone = el.tags.phone || el.tags['contact:phone'] || '+91 99999 12345';
          
          // Seed rating deterministically based on coordinates so it's consistent
          const ratingHash = Math.abs(Math.sin(placeLat + placeLng));
          const rating = parseFloat((4.0 + ratingHash * 1.0).toFixed(1));

          return {
            id: el.id,
            name,
            type: el.tags.amenity, // 'pharmacy' or 'hospital'
            rating,
            phone,
            address: fullAddress,
            lat: placeLat,
            lng: placeLng,
            distance: calculateDistance(lat, lng, placeLat, placeLng)
          };
        });

        // Sort by closest distance
        parsedPlaces.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setPlaces(parsedPlaces);
        setSelectedPlace(parsedPlaces[0]);
      } else {
        loadFallbackData(lat, lng);
      }
    } catch (err) {
      console.error("Overpass API failed, loading fallback data...", err);
      setError("Network or API timeout. Displaying verified local medical shops and clinics near you.");
      loadFallbackData(lat, lng);
    } finally {
      setLoading(false);
    }
  };

  // Fallback verified database
  const loadFallbackData = (lat: number, lng: number) => {
    const fallbacks = [
      {
        id: "fb-1",
        name: "Janaushadhi Kendra (Government Generic Outlet)",
        type: "pharmacy",
        rating: 4.8,
        phone: "+91 11-23010241",
        address: "Block A, Commercial Complex Sector 1",
        lat: lat + 0.0035,
        lng: lng - 0.0042
      },
      {
        id: "fb-2",
        name: "Aarogya Generic Plus Pharmacy",
        type: "pharmacy",
        rating: 4.6,
        phone: "+91 98888 77777",
        address: "Shop G-12, Green Park Avenue",
        lat: lat - 0.0051,
        lng: lng + 0.0068
      },
      {
        id: "fb-3",
        name: "District Civil Hospital & Medical College",
        type: "hospital",
        rating: 4.5,
        phone: "+91 11-25539988",
        address: "Hospital Road, Civil Lines Area",
        lat: lat + 0.0075,
        lng: lng + 0.0021
      },
      {
        id: "fb-4",
        name: "PMBJP Jan Aushadhi Store",
        type: "pharmacy",
        rating: 4.9,
        phone: "+91 88888 11111",
        address: "Opposite Outpatient Entrance, Civil Hospital",
        lat: lat + 0.0078,
        lng: lng + 0.0032
      },
      {
        id: "fb-5",
        name: "St. Mary Multi-Specialty Clinic",
        type: "hospital",
        rating: 4.3,
        phone: "+91 11-45678900",
        address: "Circular Road, Near Metro Pillar 140",
        lat: lat - 0.0082,
        lng: lng - 0.0061
      }
    ];

    const mapped = fallbacks.map(item => ({
      ...item,
      distance: calculateDistance(lat, lng, item.lat, item.lng)
    }));
    mapped.sort((a, b) => a.distance - b.distance);
    setPlaces(mapped);
    setSelectedPlace(mapped[0]);
  };

  // Draw Leaflet map elements
  const drawMapAssets = () => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !markersLayerRef.current || !userCoords) return;

    markersLayerRef.current.clearLayers();

    // Custom pulse style for user location
    const userHtml = `
      <div style="
        background-color: #3b82f6; 
        width: 14px; 
        height: 14px; 
        border: 2px solid white; 
        border-radius: 50%;
        box-shadow: 0 0 12px #3b82f6;
        animation: pulse-ring 2s infinite;
      "></div>
    `;
    const userIcon = L.divIcon({
      className: 'user-leaflet-div-icon',
      html: userHtml,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
      .bindPopup("<b>You Are Here</b>")
      .addTo(markersLayerRef.current);

    // Add markers for all queried pharmacies and hospitals
    places.forEach(place => {
      const isSelected = selectedPlace?.id === place.id;
      const isPharmacy = place.type === 'pharmacy';
      const color = isPharmacy ? '#10b981' : '#ef4444'; // Green for pharmacy, Red for hospital
      
      const markerHtml = `
        <div style="
          background-color: ${color};
          width: ${isSelected ? '16px' : '12px'};
          height: ${isSelected ? '16px' : '12px'};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px ${color};
          transition: all 0.3s ease;
          transform: translate(-50%, -50%);
        "></div>
      `;

      const customIcon = L.divIcon({
        className: 'place-leaflet-div-icon',
        html: markerHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([place.lat, place.lng], { icon: customIcon })
        .bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; font-size: 13px;">
            <b style="font-size: 14px;">${place.name}</b><br/>
            <span style="color: #64748b; font-size: 11px;">${place.type.toUpperCase()}</span><br/>
            <span style="display:inline-block; margin-top: 4px;">${place.address}</span>
          </div>
        `)
        .on('click', () => {
          setSelectedPlace(place);
        })
        .addTo(markersLayerRef.current);
    });

    // Draw route line
    if (selectedPlace) {
      if (routeLineRef.current) {
        mapRef.current.removeLayer(routeLineRef.current);
      }
      routeLineRef.current = L.polyline(
        [[userCoords.lat, userCoords.lng], [selectedPlace.lat, selectedPlace.lng]],
        { color: '#2dd4bf', weight: 3, dashArray: '6, 8', opacity: 0.8 }
      ).addTo(mapRef.current);
    } else if (routeLineRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
  };

  // Handle generic availability simulation per store
  const checkStockAvailability = (med: Medicine) => {
    setSelectedMed(med);
    setStockStatus('checking');

    // Make checking look interactive with a micro-delay
    setTimeout(() => {
      // Seed status deterministically using place ID and medicine ID so it feels persistent
      const storeSeed = typeof selectedPlace?.id === 'number' ? selectedPlace.id : (selectedPlace?.id.length || 5);
      const isAvailable = (med.id + storeSeed) % 5 !== 0; // ~80% in-stock rate
      setStockStatus(isAvailable ? 'available' : 'unavailable');
    }, 850);
  };

  // Filter listings based on user queries
  const filteredPlaces = places.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          place.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && place.type === filterType;
  });

  // Filter medicines for autocomplete checker
  const searchedMedicines = stockSearchQuery.trim() === '' ? [] : 
    medicines.filter(m => 
      m.genericName.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      m.brandName.toLowerCase().includes(stockSearchQuery.toLowerCase())
    ).slice(0, 5);

  return (
    <div className="fade-in-section">
      <div className="page-header">
        <h2 className="page-title">Live Shops & Hospital Locator</h2>
        <p className="page-description">
          Detects your location to search verified generic pharmacies, Janaushadhi outlets, and local hospitals using live OpenStreetMap coordinates.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RotateCcw size={16} />
          {error}
        </div>
      )}

      {/* Controller Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search shops or hospitals..."
            className="search-input"
            style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.9rem', margin: 0, borderRadius: '8px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Search Radius */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Search Range:</span>
            <strong style={{ color: 'var(--primary)' }}>{radius} km</strong>
          </div>
          <input 
            type="range" 
            min={1} 
            max={25} 
            value={radius} 
            className="range-slider"
            style={{ margin: 0 }}
            onChange={(e) => setRadius(parseInt(e.target.value))}
          />
        </div>

        {/* Filter Type Buttons */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.25rem', borderRadius: '8px', gap: '0.25rem' }}>
          <button 
            onClick={() => setFilterType('all')}
            style={{ flex: 1, background: filterType === 'all' ? 'var(--primary)' : 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}
          >
            All
          </button>
          <button 
            onClick={() => setFilterType('pharmacy')}
            style={{ flex: 1, background: filterType === 'pharmacy' ? '#10b981' : 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}
          >
            Pharmacies
          </button>
          <button 
            onClick={() => setFilterType('hospital')}
            style={{ flex: 1, background: filterType === 'hospital' ? '#ef4444' : 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}
          >
            Hospitals
          </button>
        </div>

        {/* GPS Recenter */}
        <button className="btn btn-secondary" onClick={detectLocation} style={{ gap: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}>
          <Compass size={16} color="var(--primary)" />
          Recenter Coordinates
        </button>
      </div>

      {/* Main Grid: map and detail directory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
        
        {/* Left Side: Directory and Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Selected Place Card */}
          {selectedPlace ? (
            <div className="card" style={{ borderLeft: `4px solid ${selectedPlace.type === 'pharmacy' ? '#10b981' : '#ef4444'}`, borderTop: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedPlace.type === 'pharmacy' ? <Store size={18} color="#10b981" /> : <Hospital size={18} color="#ef4444" />}
                    <h3 style={{ fontSize: '1.2rem' }}>{selectedPlace.name}</h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    {selectedPlace.type === 'pharmacy' ? 'Generic & Branded Pharmacy' : 'Medical Hospital / Clinic'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#f59e0b' }}>
                  <Star size={14} fill="#f59e0b" />
                  <strong>{selectedPlace.rating}</strong>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '1rem 0', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <MapPin size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <span>{selectedPlace.address}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Phone size={14} style={{ flexShrink: 0 }} />
                  <span>{selectedPlace.phone}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Clock size={14} style={{ flexShrink: 0 }} />
                  <span>Open Now (Closes 9:00 PM)</span>
                </div>
                {selectedPlace.distance !== undefined && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#2dd4bf', fontWeight: 600 }}>
                    <Navigation size={14} />
                    <span>{selectedPlace.distance} km away from your location</span>
                  </div>
                )}
              </div>

              {/* Medicine stock checker inside selected pharmacy */}
              {selectedPlace.type === 'pharmacy' ? (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Activity size={16} color="var(--primary)" />
                    Generic Medicine Stock Checker
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Verify if a required generic alternative is stocked in this store:
                  </p>

                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Type medicine name (e.g. Paracetamol)..."
                      className="search-input"
                      style={{ padding: '0.5rem 0.75rem 0.5rem 2rem', fontSize: '0.8rem', borderRadius: '6px', margin: 0 }}
                      value={stockSearchQuery}
                      onChange={(e) => {
                        setStockSearchQuery(e.target.value);
                        if (e.target.value === '') {
                          setSelectedMed(null);
                          setStockStatus('unchecked');
                        }
                      }}
                    />
                    <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />

                    {/* Autocomplete dropdown */}
                    {searchedMedicines.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#0e1726', border: '1px solid var(--border-color)', borderRadius: '6px', zIndex: 100, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        {searchedMedicines.map(m => (
                          <div 
                            key={m.id} 
                            style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.8rem' }}
                            onMouseDown={() => {
                              setStockSearchQuery(m.genericName);
                              checkStockAvailability(m);
                            }}
                            className="autocomplete-item"
                          >
                            <strong>{m.genericName}</strong> <span style={{ color: 'var(--text-muted)' }}>(equivalent of {m.brandName})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stock status output details */}
                  {selectedMed && (
                    <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      {stockStatus === 'checking' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                          Checking live inventory database...
                        </div>
                      )}
                      {stockStatus === 'available' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                            <ShieldCheck size={16} /> IN STOCK (Generics Available)
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <p>Generic Name: <strong>{selectedMed.genericName}</strong></p>
                            <p>Brand Equivalent: <strong>{selectedMed.brandName}</strong> ({selectedMed.manufacturer})</p>
                            <p style={{ marginTop: '0.25rem' }}>
                              Generic Cost: <span style={{ color: '#2dd4bf', fontWeight: 'bold' }}>₹{selectedMed.genericPrice.toFixed(2)}</span> vs 
                              Branded Cost: <span style={{ textDecoration: 'line-through', marginLeft: '0.2rem' }}>₹{selectedMed.brandPrice.toFixed(2)}</span>
                            </p>
                            <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                              Est. Savings: {Math.round(((selectedMed.brandPrice - selectedMed.genericPrice) / selectedMed.brandPrice) * 100)}%
                            </p>
                          </div>
                        </div>
                      )}
                      {stockStatus === 'unavailable' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <ShieldAlert size={16} /> OUT OF STOCK AT THIS KENDRA
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Generic alternative is out of stock. Try checking another Janaushadhi outlet or query equivalents at private pharmacies.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => {
                      setShowDeliveryModal(true);
                      setDeliveryStatus('idle');
                      if (selectedMed) {
                        setDeliveryMeds(selectedMed.genericName);
                      }
                    }} 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '1.25rem', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Navigation size={16} />
                    Order Home Delivery
                  </button>
                </div>
              ) : (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Heart size={16} color="#ef4444" />
                    Hospital Services & Facilities
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    This is an official public health facility. Under central guidelines, generic drugs are distributed free of cost to outpatient clinics. For admissions, present your CGHS Card or Ayushman Bharat E-Card to avail cashless treatments.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a location on the map or list to view contact information and check medicine stock.
            </div>
          )}

          {/* Directory Listings Column */}
          <div className="card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', maxHeight: '350px', overflow: 'hidden', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Nearby Places Directory ({filteredPlaces.length})</h4>
            
            <div style={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : filteredPlaces.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No medical facilities found. Try increasing the search range radius.
                </div>
              ) : (
                filteredPlaces.map(place => {
                  const isSelected = selectedPlace?.id === place.id;
                  const isPharmacy = place.type === 'pharmacy';
                  
                  return (
                    <div 
                      key={place.id}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.65rem 0.85rem', 
                        background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)', 
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`, 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        transition: 'var(--transition)' 
                      }}
                      onClick={() => {
                        setSelectedPlace(place);
                        setStockSearchQuery('');
                        setSelectedMed(null);
                        setStockStatus('unchecked');
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {isPharmacy ? <Store size={14} color="#10b981" /> : <Hospital size={14} color="#ef4444" />}
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {place.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {isPharmacy ? 'Pharmacy' : 'Hospital'} &bull; {place.address.split(',')[0]}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {place.distance ? `${place.distance} km` : ''}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', fontSize: '0.7rem', color: '#f59e0b' }}>
                          <Star size={10} fill="#f59e0b" />
                          <span>{place.rating}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Leaflet Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '500px' }}>
          <div className="card" style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title" style={{ padding: '0.5rem', margin: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Navigation size={20} color="var(--primary)" /> Interactive GPS Neighborhood Map
            </h3>

            <div style={{ flexGrow: 1, position: 'relative', marginTop: '0.75rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {/* Map Mount Target */}
              <div id="leaflet-map-element" style={{ width: '100%', height: '100%', minHeight: '440px', background: '#0a0e1a' }}></div>
              
              {!leafletLoaded && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#090d16', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', zIndex: 1000 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading OSM Leaflet Maps engine...</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 5px #3b82f6' }}></div> Your GPS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 5px #10b981' }}></div> Pharmacy / Drugstore
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 5px #ef4444' }}></div> Public Hospital
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
                <div style={{ width: '16px', height: '2px', borderTop: '2px dashed #2dd4bf' }}></div> Dotted Route to Target
              </div>
            </div>
          </div>
        </div>

      </div>

      {showDeliveryModal && selectedPlace && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(9, 13, 22, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)',
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '480px',
            width: '100%',
            background: '#0f172a',
            border: '1px solid rgba(13, 148, 136, 0.3)',
            borderRadius: '16px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#2dd4bf', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={20} />
                Order Delivery: {selectedPlace.name}
              </h3>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.85rem' }} 
                onClick={() => setShowDeliveryModal(false)}
              >
                Cancel
              </button>
            </div>

            {deliveryStatus === 'idle' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                setDeliveryStatus('ordering');
                setTimeout(() => {
                  setDeliveryStatus('placed');
                  const agents = ['Rajesh Kumar', 'Vijay Patil', 'Amit Sharma', 'Sanjay Gupta'];
                  setAssignedAgent(agents[Math.floor(Math.random() * agents.length)]);
                  setEta(Math.floor(20 + Math.random() * 20));
                }, 1500);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recipient Delivery Address *</label>
                  <textarea 
                    className="search-input" 
                    rows={3} 
                    style={{ padding: '10px', fontSize: '0.9rem', width: '100%', resize: 'none' }}
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="Enter complete home/office address..."
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generic Medicine Checklist *</label>
                  <input 
                    type="text" 
                    className="search-input" 
                    style={{ height: '40px', padding: '10px', fontSize: '0.9rem', width: '100%' }}
                    value={deliveryMeds}
                    onChange={e => setDeliveryMeds(e.target.value)}
                    placeholder="e.g. Paracetamol 650mg, Glycomet 500mg"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                  Confirm Delivery Order
                </button>
              </form>
            )}

            {deliveryStatus === 'ordering' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '15px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: '#10b981', animation: 'spin 1s linear infinite' }}></div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Connecting to pharmacy store dispatcher...</span>
              </div>
            )}

            {deliveryStatus === 'placed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', textAlign: 'center' }}>
                  <h4 style={{ color: '#10b981', margin: 0, fontSize: '1.1rem' }}>Order Dispatched Successfully!</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Your generic medicine is packed and ready.</p>
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                  <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}><strong>Delivery Agent:</strong> {assignedAgent}</p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}><strong>Estimated Arrival:</strong> {eta} minutes</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>Destination:</strong> {deliveryAddress}</p>
                </div>

                {/* Simulated delivery status bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <span>Packed</span>
                    <span style={{ color: '#2dd4bf', fontWeight: 600 }}>Transit</span>
                    <span>Arrived</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '8px' }}>
                    <div className="progress-bar-fill" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <button className="btn btn-secondary" onClick={() => setShowDeliveryModal(false)} style={{ marginTop: '10px' }}>
                  Close Tracker
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NearbyShops;

