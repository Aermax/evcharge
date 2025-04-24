import { Station } from '@shared/schema';
import { Zap } from 'lucide-react';

interface StationMarkerProps {
  station: Station;
  isSelected: boolean;
  onClick: () => void;
}

export default function StationMarker({
  station,
  isSelected,
  onClick
}: StationMarkerProps) {
  // This component helps structure SVG marker icons for map usage
  // In this implementation, the actual DOM elements are created in MapView
  // and this component just exports what we need
  
  // The color of the marker depends on port availability
  const getMarkerColor = () => {
    // We would get this from the API in a real implementation
    // Just mocking it here based on station details
    const portData = {
      available: 3,
      total: 6
    };
    
    if (portData.available === 0) {
      return '#FF3B30'; // Unavailable - red
    } else if (portData.available <= 1) {
      return '#FF9500'; // Limited availability - orange
    } else {
      return '#34C759'; // Available - green
    }
  };
  
  const markerStyle = {
    backgroundColor: isSelected ? '#3366CC' : getMarkerColor(),
    color: 'white',
    width: isSelected ? '36px' : '30px',
    height: isSelected ? '36px' : '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'all 0.2s ease',
    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
    cursor: 'pointer'
  };
  
  return (
    <div style={markerStyle} onClick={onClick} className={isSelected ? 'animate-pulse' : ''}>
      <Zap className="h-4 w-4" />
    </div>
  );
}
