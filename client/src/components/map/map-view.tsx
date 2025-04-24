import { useEffect, useRef, useState } from 'react';
import { Station } from '@shared/schema';
import StationMarker from './station-marker';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Locate } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Import Leaflet CSS - this will be loaded by the runtime
// We use a CDN URL for this since we can't bundle it
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

interface MapViewProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
}

// Helper to dynamically load scripts
const loadScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Skip if already loaded
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

// Helper to dynamically load CSS
const loadCSS = (href: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Skip if already loaded
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    document.head.appendChild(link);
  });
};

export default function MapView({ 
  stations, 
  selectedStation, 
  onSelectStation 
}: MapViewProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Load Leaflet CSS
        await loadCSS(LEAFLET_CSS_URL, 'leaflet-css');
        
        // Load Leaflet JS
        await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'leaflet-js');
        
        // Set map as loaded when dependencies are ready
        setIsMapLoaded(true);
        
        // Request user's location after Leaflet loads
        getUserLocation();
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };
    
    loadLeaflet();
  }, []);
  
  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!isMapLoaded || !mapContainerRef.current) return;
    
    const L = window.L;
    if (!L) return;
    
    // Default center if user location not available
    const defaultCenter: [number, number] = [37.7749, -122.4194]; // San Francisco
    const center = userLocation || defaultCenter;
    
    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView(center, 13);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);
    
    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `
          <div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3b82f6;">
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      
      L.marker(userLocation, { icon: userIcon }).addTo(mapRef.current);
    }
    
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isMapLoaded, userLocation]);
  
  // Add station markers when stations change
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || stations.length === 0) return;
    
    const L = window.L;
    if (!L) return;
    
    // Clear existing markers
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        mapRef.current.removeLayer(layer);
      }
    });
    
    // Add user location marker back if it exists
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `
          <div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3b82f6;">
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      
      L.marker(userLocation, { icon: userIcon }).addTo(mapRef.current);
    }
    
    // Add station markers
    stations.forEach(station => {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      // Determine marker color based on status (this would come from an API in a real app)
      const isSelected = selectedStation?.id === station.id;
      
      // Create marker icon
      const iconHtml = `
        <div class="${isSelected ? 'animate-pulse' : ''}" style="
          background-color: ${isSelected ? '#3366CC' : '#34C759'}; 
          color: white; 
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          transition: transform 0.2s ease;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
      `;
      
      const icon = L.divIcon({
        html: iconHtml,
        className: isSelected ? 'station-marker selected' : 'station-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      // Create marker and add to map
      const marker = L.marker([lat, lng], { icon })
        .addTo(mapRef.current)
        .on('click', () => {
          onSelectStation(station);
        });
      
      // Add popup with basic station info
      marker.bindPopup(`
        <div style="width: 200px;">
          <h3 style="font-weight: bold;">${station.name}</h3>
          <p style="margin: 4px 0;">${station.address}</p>
          <p style="margin: 4px 0;">${station.powerKw}kW · ${station.distance} mi</p>
        </div>
      `);
    });
    
    // If a station is selected, center map on it
    if (selectedStation) {
      const lat = parseFloat(selectedStation.latitude);
      const lng = parseFloat(selectedStation.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        mapRef.current.setView([lat, lng], 15);
      }
    }
  }, [isMapLoaded, stations, selectedStation, onSelectStation, userLocation]);
  
  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(userCoords);
          
          // Center map on user location
          if (mapRef.current) {
            mapRef.current.setView(userCoords, 14);
          }
          
          // Send user coordinates to console for debugging
          console.log(`User location: ${userCoords[0]}, ${userCoords[1]}`);
          
          // Dispatch custom event with user location to update station distances in HomePage
          const userLocationEvent = new CustomEvent('userLocationFound', {
            detail: { lat: userCoords[0], lng: userCoords[1] }
          });
          window.dispatchEvent(userLocationEvent);
          
          // Force a re-render by setting a state
          if (mapRef.current) {
            // Clear and re-add markers
            mapRef.current.eachLayer((layer: any) => {
              if (layer instanceof window.L.Marker) {
                mapRef.current.removeLayer(layer);
              }
            });
            
            // Re-add user location marker
            if (userLocation) {
              const userIcon = window.L.divIcon({
                html: `
                  <div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px #3b82f6;">
                  </div>
                `,
                className: 'user-location-marker',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              });
              
              window.L.marker(userCoords, { icon: userIcon }).addTo(mapRef.current);
            }
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in miles
    return distance;
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  };
  
  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full bg-gray-100"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Map Controls */}
      <div className="absolute right-4 top-4 flex flex-col space-y-2">
        <Button variant="secondary" size="icon" className="rounded-full shadow-md" onClick={handleZoomIn}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="rounded-full shadow-md" onClick={handleZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="rounded-full shadow-md" onClick={getUserLocation}>
          <Locate className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
