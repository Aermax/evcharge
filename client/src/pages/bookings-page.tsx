import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Header from "@/components/header/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Booking } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, MapPin, Zap, CarFront, AlertTriangle } from "lucide-react";

// Helper to get the status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-orange-100 text-orange-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");

  // Fetch user's bookings
  const { data: bookings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter bookings by status for tabs
  const upcomingBookings = bookings?.filter(
    (booking) => booking.status === "pending" || booking.status === "confirmed"
  ) || [];
  
  const pastBookings = bookings?.filter(
    (booking) => booking.status === "completed" || booking.status === "cancelled"
  ) || [];

  // Cancel booking handler
  const handleCancelBooking = async (bookingId: number) => {
    try {
      await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status: "cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Manage your charging station reservations</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900">No upcoming bookings</h3>
                  <p className="text-gray-500 text-center mt-2 max-w-md">
                    You don't have any upcoming bookings. Find a charging station and book a slot.
                  </p>
                  <Button className="mt-6" onClick={() => window.location.href = "/"}>
                    Find Charging Stations
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{booking.station?.name}</CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{booking.station?.address}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {booking.date}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {booking.startTime} - {booking.endTime} ({booking.duration} min)
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Zap className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {booking.port?.type}, {booking.port?.powerKw}kW (Port #{booking.port?.name})
                          </span>
                        </div>
                        {booking.vehicleInfo && (
                          <div className="flex items-center text-sm">
                            <CarFront className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{booking.vehicleInfo}</span>
                          </div>
                        )}

                        <Separator />
                        
                        <div className="pt-2">
                          <Button 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel Booking
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pastBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <Clock className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900">No past bookings</h3>
                  <p className="text-gray-500 text-center mt-2 max-w-md">
                    Your booking history will appear here once you complete some bookings.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pastBookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{booking.station?.name}</CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{booking.station?.address}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {booking.date}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {booking.startTime} - {booking.endTime} ({booking.duration} min)
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Zap className="h-4 w-4 mr-2 text-gray-500" />
                          <span>
                            {booking.port?.type}, {booking.port?.powerKw}kW (Port #{booking.port?.name})
                          </span>
                        </div>
                        {booking.vehicleInfo && (
                          <div className="flex items-center text-sm">
                            <CarFront className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{booking.vehicleInfo}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
