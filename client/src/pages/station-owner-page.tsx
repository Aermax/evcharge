import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Station, Port, Booking, InsertStation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BatteryCharging, Plus, Map, Calendar, UserCheck, Edit, Trash, MapPin } from "lucide-react";

export default function StationOwnerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddStation, setShowAddStation] = useState(false);
  const [activeTab, setActiveTab] = useState("stations");
  const mapRef = useRef<HTMLDivElement>(null);
  
  // State for new station form
  const [newStation, setNewStation] = useState<Partial<InsertStation>>({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    pricePerKwh: "",
    powerKw: 50,
    description: "",
    connectorTypes: [],
    amenities: [],
  });

  // Check if user is authenticated and is a station owner
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Fetch owner's stations
  const {
    data: stations,
    isLoading: isLoadingStations,
    isError: isStationsError,
  } = useQuery<Station[]>({
    queryKey: ["/api/stations/owner"],
    queryFn: async () => {
      const res = await fetch(`/api/stations/owner/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch stations");
      return res.json();
    },
  });

  // Fetch bookings for owner's stations
  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isError: isBookingsError,
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/owner"],
    queryFn: async () => {
      if (!stations || stations.length === 0) return [];
      const stationIds = stations.map(station => station.id).join(",");
      const res = await fetch(`/api/bookings/stations?ids=${stationIds}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    enabled: !!stations && stations.length > 0,
  });

  // Mutation to add a new station
  const addStationMutation = useMutation({
    mutationFn: async (stationData: InsertStation) => {
      const res = await apiRequest("POST", "/api/stations", stationData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stations/owner"] });
      setShowAddStation(false);
      toast({
        title: "Station Added",
        description: "Your charging station has been successfully added",
      });
      
      // Reset form
      setNewStation({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        pricePerKwh: "",
        powerKw: 50,
        description: "",
        connectorTypes: [],
        amenities: [],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add station",
        variant: "destructive",
      });
    },
  });

  // Initialize map for location selection
  useEffect(() => {
    if (showAddStation && mapRef.current) {
      // Default to Lonavala location
      const defaultLat = 18.7546;
      const defaultLng = 73.4039;
      
      // Create map instance
      const loadMap = async () => {
        try {
          // In a real implementation, you would load Leaflet here and create an interactive map
          // for station location selection. For this demo, we'll just simulate it.
          
          // Simulate selecting Lonavala location
          setNewStation(prev => ({
            ...prev, 
            latitude: defaultLat.toString(),
            longitude: defaultLng.toString()
          }));
        } catch (error) {
          console.error("Error initializing map:", error);
        }
      };
      
      loadMap();
    }
  }, [showAddStation]);

  // Handle new station submission
  const handleAddStation = () => {
    // Validate form
    if (!newStation.name || !newStation.address || !newStation.latitude || !newStation.longitude || !newStation.pricePerKwh) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Add owner ID
    const stationData: InsertStation = {
      ...newStation as InsertStation,
      ownerId: user.id,
      // Convert string values to appropriate types
      powerKw: typeof newStation.powerKw === 'string' ? parseInt(newStation.powerKw) : newStation.powerKw,
      connectorTypes: newStation.connectorTypes || ["Type 2", "CCS"],
      amenities: newStation.amenities || ["Parking", "Restrooms"],
    };
    
    addStationMutation.mutate(stationData);
  };

  // Loading state
  const isLoading = isLoadingStations || isLoadingBookings;
  const isError = isStationsError || isBookingsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Count active bookings
  const activeBookingsCount = bookings?.filter(
    (booking) => booking.status === "confirmed" || booking.status === "pending"
  ).length || 0;

  return (
    <div className="container mx-auto my-6 px-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Station Owner Dashboard</h1>
          <Badge variant="outline" className="text-sm">
            {user.firstName} {user.lastName}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                My Stations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BatteryCharging className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {stations?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{activeBookingsCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {getUniqueCustomersCount(bookings || [])}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowAddStation(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add New Station
          </Button>
        </div>

        <Tabs
          defaultValue="stations"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stations">My Stations</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="stations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Station Management</CardTitle>
                <CardDescription>
                  Manage your charging stations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stations && stations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Price/kWh</TableHead>
                        <TableHead>Power</TableHead>
                        <TableHead>Connector Types</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stations.map((station) => (
                        <TableRow key={station.id}>
                          <TableCell className="font-medium">
                            {station.name}
                          </TableCell>
                          <TableCell>{station.address}</TableCell>
                          <TableCell>₹{station.pricePerKwh}</TableCell>
                          <TableCell>{station.powerKw}kW</TableCell>
                          <TableCell>
                            {(station.connectorTypes || []).join(", ")}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Station"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View on Map"
                              >
                                <Map className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <BatteryCharging className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Stations Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't added any charging stations
                    </p>
                    <Button onClick={() => setShowAddStation(true)}>
                      Add Your First Station
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>
                  Monitor and manage bookings at your stations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings && bookings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Station</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{booking.id}</TableCell>
                          <TableCell>
                            {findStationName(stations || [], booking.stationId)}
                          </TableCell>
                          <TableCell>{booking.date}</TableCell>
                          <TableCell>
                            {booking.startTime} - {booking.endTime}
                          </TableCell>
                          <TableCell>User #{booking.userId}</TableCell>
                          <TableCell>{booking.vehicleInfo || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.status === "completed"
                                  ? "outline"
                                  : booking.status === "confirmed"
                                  ? "default"
                                  : booking.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Bookings Yet</h3>
                    <p className="text-muted-foreground">
                      You don't have any bookings for your stations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Station Dialog */}
      <Dialog open={showAddStation} onOpenChange={setShowAddStation}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Charging Station</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="station-name">Station Name</Label>
                <Input
                  id="station-name"
                  value={newStation.name}
                  onChange={(e) =>
                    setNewStation({ ...newStation, name: e.target.value })
                  }
                  placeholder="Enter station name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per kWh (₹)</Label>
                <Input
                  id="price"
                  value={newStation.pricePerKwh}
                  onChange={(e) =>
                    setNewStation({ ...newStation, pricePerKwh: e.target.value })
                  }
                  placeholder="e.g. 12.50"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newStation.address}
                onChange={(e) =>
                  setNewStation({ ...newStation, address: e.target.value })
                }
                placeholder="Full address of the charging station"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newStation.description || ""}
                onChange={(e) =>
                  setNewStation({ ...newStation, description: e.target.value })
                }
                placeholder="Describe your charging station"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="power">Power (kW)</Label>
                <Input
                  id="power"
                  value={newStation.powerKw}
                  onChange={(e) =>
                    setNewStation({
                      ...newStation,
                      powerKw: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g. 50"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newStation.latitude}
                    onChange={(e) =>
                      setNewStation({ ...newStation, latitude: e.target.value })
                    }
                    placeholder="Latitude"
                  />
                  <Input
                    value={newStation.longitude}
                    onChange={(e) =>
                      setNewStation({ ...newStation, longitude: e.target.value })
                    }
                    placeholder="Longitude"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Location on Map</Label>
              <div 
                ref={mapRef} 
                className="w-full h-[200px] bg-gray-100 rounded-md flex items-center justify-center"
              >
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p>Map would appear here for location selection</p>
                  <p className="text-xs">Using Lonavala location (18.7546, 73.4039)</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline" 
              onClick={() => setShowAddStation(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddStation}
              disabled={addStationMutation.isPending}
            >
              {addStationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Station"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper functions
function getUniqueCustomersCount(bookings: Booking[]): number {
  const uniqueCustomers = new Set();
  bookings.forEach((booking) => {
    uniqueCustomers.add(booking.userId);
  });
  return uniqueCustomers.size;
}

function findStationName(stations: Station[], stationId: number): string {
  const station = stations.find((s) => s.id === stationId);
  return station ? station.name : `Station #${stationId}`;
}
