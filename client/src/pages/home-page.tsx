import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import Header from "@/components/header/header"
import StationList from "@/components/stations/station-list"
import StationDetails from "@/components/stations/station-details"
import MapView from "@/components/map/map-view"
import MobileStationBar from "@/components/mobile/mobile-station-bar"
import { useAuth } from "@/hooks/use-auth"
import { Station } from "@shared/schema"
import { useMobile } from "@/hooks/use-mobile"
import ChatBot from "@/components/chatbot/chatbot"

export default function HomePage() {
  const { user } = useAuth()
  const isMobile = useMobile()
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [mobileListVisible, setMobileListVisible] = useState(false)

  // State for location-based station data
  const [locationAwareStations, setLocationAwareStations] = useState<Station[]>(
    []
  )

  // Fetch stations
  const { data: stations, isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"]
  })

  // Update stations when data changes
  useEffect(() => {
    if (stations) {
      setLocationAwareStations(stations)
    }
  }, [stations])

  // Function to update stations with distance when user location changes
  const updateStationsWithLocation = (userLat: number, userLng: number) => {
    if (!stations) return

    // Calculate distance for each station and update state
    const updatedStations = stations.map((station: Station) => {
      const stationLat = parseFloat(station.latitude)
      const stationLng = parseFloat(station.longitude)

      if (!isNaN(stationLat) && !isNaN(stationLng)) {
        // Calculate distance (very rough approximation)
        const distance = calculateDistance(
          userLat,
          userLng,
          stationLat,
          stationLng
        )
        // Return a new station object with updated distance
        return {
          ...station,
          distance: distance.toFixed(1)
        }
      }

      return station
    })

    // Update state with new distances
    setLocationAwareStations(updatedStations)
  }

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 3958.8 // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance in miles
    return distance
  }

  // Listen for user location events from the map
  useEffect(() => {
    const handleUserLocationFound = (e: CustomEvent) => {
      const { lat, lng } = e.detail
      updateStationsWithLocation(lat, lng)
    }

    window.addEventListener(
      "userLocationFound",
      handleUserLocationFound as EventListener
    )

    return () => {
      window.removeEventListener(
        "userLocationFound",
        handleUserLocationFound as EventListener
      )
    }
  }, [stations])

  // Handler for selecting a station
  const handleStationSelect = (station: Station) => {
    setSelectedStation(station)
    if (isMobile) {
      setMobileListVisible(false)
    }
  }

  // Handler for going back to the list view
  const handleBackToList = () => {
    setSelectedStation(null)
  }

  // Toggle mobile station list
  const toggleMobileList = () => {
    setMobileListVisible(!mobileListVisible)
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <ChatBot />

      <main className="flex-1 relative overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar for station listing and details */}
          <div
            className={`bg-white w-96 shadow-lg z-10 overflow-hidden hidden md:block`}
          >
            {selectedStation ? (
              <StationDetails
                station={selectedStation}
                onBack={handleBackToList}
              />
            ) : (
              <StationList
                stations={locationAwareStations}
                isLoading={isLoading}
                onSelectStation={handleStationSelect}
              />
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative z-0">
            <MapView
              stations={locationAwareStations}
              selectedStation={selectedStation}
              onSelectStation={handleStationSelect}
            />

            {/* Mobile Station Bar */}
            {isMobile && (
              <MobileStationBar
                stations={locationAwareStations}
                selectedStation={selectedStation}
                onSelectStation={handleStationSelect}
                isListVisible={mobileListVisible}
                toggleList={toggleMobileList}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
