import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StationCard from "./station-card";
import { Station } from "@shared/schema";
import { Search, SlidersHorizontal } from "lucide-react";

interface StationListProps {
  stations: Station[];
  isLoading: boolean;
  onSelectStation: (station: Station) => void;
}

export default function StationList({
  stations,
  isLoading,
  onSelectStation,
}: StationListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    availableNow: true,
    fastCharge: false,
  });

  // Filter and sort stations based on search and filters
  const filteredStations = stations
    .filter((station) => {
      // Search filter
      const matchesSearch =
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.address.toLowerCase().includes(searchTerm.toLowerCase());

      // Fast charging filter
      const matchesFastCharge = !filters.fastCharge || 
        (station.powerKw && parseFloat(station.powerKw) >= 50);

      // Additional filters would go here, but for the demo we're not implementing them fully
      return matchesSearch && matchesFastCharge;
    })
    // Sort by distance if available
    .sort((a, b) => {
      if (a.distance && b.distance) {
        return parseFloat(a.distance) - parseFloat(b.distance);
      }
      return 0;
    });

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters({
      ...filters,
      [filter]: !filters[filter],
    });
  };

  return (
    <div>
      {/* Search/filter bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            className="pl-10"
            placeholder="Search stations or addresses"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mt-3 flex space-x-2">
          <Button
            size="sm"
            variant={filters.availableNow ? "default" : "outline"}
            className={`rounded-full text-xs ${
              filters.availableNow
                ? ""
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            onClick={() => toggleFilter("availableNow")}
          >
            Available Now
          </Button>
          <Button
            size="sm"
            variant={filters.fastCharge ? "default" : "outline"}
            className={`rounded-full text-xs ${
              filters.fastCharge
                ? ""
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            onClick={() => toggleFilter("fastCharge")}
          >
            Fast Charge
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs bg-white hover:bg-gray-100 text-gray-700"
          >
            <SlidersHorizontal className="h-3 w-3 mr-1" /> Filters
          </Button>
        </div>
      </div>

      {/* Stations list header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Nearby Stations</h2>
        <span className="text-sm text-gray-500">
          {isLoading ? "Loading..." : `${filteredStations.length} found`}
        </span>
      </div>

      {/* Stations listing */}
      <div className="station-list overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
        {isLoading ? (
          // Loading placeholders
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 border-b border-gray-200">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
              </div>
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <div className="flex justify-between mt-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/6" />
              </div>
            </div>
          ))
        ) : filteredStations.length === 0 ? (
          // No results
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No stations found</h3>
            <p className="text-gray-500 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          // Station cards
          filteredStations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              onClick={() => onSelectStation(station)}
            />
          ))
        )}
      </div>
    </div>
  );
}
