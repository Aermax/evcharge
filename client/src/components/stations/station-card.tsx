import { Station } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Star, Zap } from "lucide-react";

interface StationCardProps {
  station: Station;
  onClick: () => void;
}

export default function StationCard({ station, onClick }: StationCardProps) {
  // Fetch ports for this station to determine availability
  const { data: ports } = useQuery({
    queryKey: [`/api/stations/${station.id}/ports`],
    enabled: !!station.id,
  });

  // Calculate available ports
  const availablePorts = ports?.filter(port => port.status === "available") || [];
  const totalPorts = ports?.length || 0;
  
  // Determine badge color based on availability
  const getBadgeVariant = () => {
    if (!ports) return "outline";
    
    if (availablePorts.length === 0) {
      return "destructive";
    } else if (availablePorts.length <= 1) {
      return "warning";
    } else {
      return "success";
    }
  };
  
  // Availability text
  const getAvailabilityText = () => {
    if (!ports) return "Loading...";
    
    if (availablePorts.length === 0) {
      return "Fully Booked";
    } else {
      return `${availablePorts.length} Available`;
    }
  };

  return (
    <div
      className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex justify-between">
        <h3 className="text-base font-medium text-gray-900">{station.name}</h3>
        <Badge variant={getBadgeVariant() as any} className="text-xs font-medium">
          {getAvailabilityText()}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mt-1">{station.address}</p>
      
      <div className="mt-2 flex items-center text-sm text-gray-500">
        <Zap className="h-4 w-4 text-primary mr-1" />
        <span>{station.powerKw}kW {station.connectorTypes?.join(", ")}</span>
      </div>
      
      <div className="mt-2 flex justify-between items-center">
        <div className="flex items-center text-sm">
          <Star className="h-4 w-4 text-amber-500 mr-1" />
          <span>{station.rating} ({station.reviewCount} reviews)</span>
        </div>
        <span className="text-sm text-gray-600">{station.distance} mi</span>
      </div>
    </div>
  );
}
