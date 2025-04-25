import { useState } from "react"
import { Station } from "@shared/schema"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, List, Zap, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import StationCard from "../stations/station-card"

interface MobileStationBarProps {
  stations: Station[]
  selectedStation: Station | null
  onSelectStation: (station: Station) => void
  isListVisible: boolean
  toggleList: () => void
}

export default function MobileStationBar({
  stations,
  selectedStation,
  onSelectStation,
  isListVisible,
  toggleList
}: MobileStationBarProps) {
  // Get the first station for preview when none is selected
  const previewStation =
    selectedStation || (stations.length > 0 ? stations[0] : null)

  // Fetch ports for selected/preview station
  const { data: ports } = useQuery({
    queryKey: previewStation
      ? [`/api/stations/${previewStation.id}/ports`]
      : null,
    enabled: !!previewStation
  })

  // Calculate available ports
  const availablePorts =
    ports?.filter((port) => port.status === "available") || []
  const totalPorts = ports?.length || 0

  // Helper to get the right badge variant
  const getBadgeVariant = () => {
    if (availablePorts.length === 0) {
      return "destructive"
    } else if (availablePorts.length <= 1) {
      return "warning"
    } else {
      return "success"
    }
  }

  if (!previewStation) {
    return null // Don't render anything if there are no stations
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white relative z-20 shadow-lg rounded-t-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {selectedStation ? "Station Details" : "Nearby Stations"}
        </h2>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={toggleList}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview of selected or first station */}
      {!isListVisible && (
        <div className="p-4">
          <div className="flex justify-between">
            <h3 className="text-base font-medium text-gray-900">
              {previewStation.name}
            </h3>
            <Badge
              variant={getBadgeVariant() as any}
              className="text-xs font-medium"
            >
              {availablePorts.length === 0
                ? "Fully Booked"
                : `${availablePorts.length} Available`}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">{previewStation.address}</p>
          <div className="mt-2 flex justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <Zap className="h-4 w-4 text-primary mr-1" />
              <span>
                {previewStation.powerKw}kW{" "}
                {previewStation.connectorTypes?.join(", ")}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {previewStation.distance} mi
            </span>
          </div>
          <Button
            className="mt-3 w-full"
            onClick={() => onSelectStation(previewStation)}
          >
            View Details & Book
          </Button>
        </div>
      )}

      {/* Expanded list view */}
      {isListVisible && (
        <div className="max-h-96 overflow-y-auto">
          {stations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              onClick={() => onSelectStation(station)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
