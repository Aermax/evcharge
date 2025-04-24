import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Station, Port } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  Zap, 
  Star, 
  DollarSign, 
  Check, 
  X, 
  Plus, 
  Minus,
  Car
} from "lucide-react";
import BookingForm from "@/components/bookings/booking-form";
import TimeSlotPicker from "@/components/bookings/time-slot-picker";

interface StationDetailsProps {
  station: Station;
  onBack: () => void;
}

export default function StationDetails({ station, onBack }: StationDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Fetch ports for this station
  const { data: ports, isLoading: portsLoading } = useQuery<Port[]>({
    queryKey: [`/api/stations/${station.id}/ports`],
    enabled: !!station.id,
  });

  const availablePorts = ports?.filter(port => port.status === "available") || [];
  
  // Create date options for the next 7 days
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, "yyyy-MM-dd"),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : format(date, "EEE, MMM d"),
    };
  });

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  // Handle port selection
  const handlePortSelect = (port: Port) => {
    setSelectedPort(port);
  };

  // Handle duration change
  const handleDurationChange = (change: number) => {
    const newDuration = duration + change;
    if (newDuration >= 30 && newDuration <= 120) {
      setDuration(newDuration);
    }
  };

  // Handle booking button click
  const handleBookNowClick = () => {
    if (!selectedPort || !selectedTimeSlot) {
      toast({
        title: "Selection Required",
        description: "Please select a port and time slot",
        variant: "destructive",
      });
      return;
    }
    
    setShowBookingForm(true);
  };
  
  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // Handle booking submission from the booking form
  const handleBookingSubmit = (bookingData: any) => {
    // Close the booking form
    setShowBookingForm(false);
    
    // Reset selection
    setSelectedPort(null);
    setSelectedTimeSlot(null);
    
    // Show success message
    toast({
      title: "Booking Successful",
      description: "Your charging session has been booked. Check your bookings for details.",
    });
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: [`/api/stations/${station.id}/ports`] });
  };

  return (
    <div>
      {/* Header with back button */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h2 className="text-lg font-medium text-gray-900">Station Details</h2>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          disabled={!user}
          onClick={() => {
            // Scroll to booking section
            const bookingSection = document.getElementById('booking-section');
            if (bookingSection) {
              bookingSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <Car className="h-4 w-4 mr-2" />
          Book Now
        </Button>
      </div>
      
      {/* Station details */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{station.name}</h2>
          <p className="text-gray-600 mt-1">{station.address}</p>
        </div>
        
        {/* Stats cards */}
        <div className="flex space-x-3 mb-4">
          <Card className="flex-1 bg-gray-50">
            <CardContent className="p-3 text-center">
              <div className="text-sm text-gray-600">Distance</div>
              <div className="font-medium text-gray-900">{station.distance} mi</div>
            </CardContent>
          </Card>
          <Card className="flex-1 bg-gray-50">
            <CardContent className="p-3 text-center">
              <div className="text-sm text-gray-600">Power</div>
              <div className="font-medium text-gray-900">{station.powerKw} kW</div>
            </CardContent>
          </Card>
          <Card className="flex-1 bg-gray-50">
            <CardContent className="p-3 text-center">
              <div className="text-sm text-gray-600">Price</div>
              <div className="font-medium text-gray-900">₹{station.pricePerKwh}/kWh</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Available Ports */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Available Ports</h3>
            <span className={`text-sm ${availablePorts.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {availablePorts.length} of {ports?.length || 0} available
            </span>
          </div>
          <div className="space-y-2">
            {portsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading ports...</div>
            ) : ports?.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No ports available</div>
            ) : (
              ports?.map((port) => (
                <div 
                  key={port.id}
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                    port.status === 'available' 
                      ? selectedPort?.id === port.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 hover:bg-gray-100'
                      : 'bg-gray-100 cursor-not-allowed'
                  }`}
                  onClick={() => port.status === 'available' && handlePortSelect(port)}
                >
                  <div>
                    <div className="font-medium">{port.type}</div>
                    <div className="text-sm opacity-80">{port.name}, {port.powerKw}kW</div>
                  </div>
                  <span className={`flex items-center ${
                    port.status === 'available' 
                      ? selectedPort?.id === port.id
                        ? 'text-white'
                        : 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {port.status === 'available' ? (
                      <>
                        {selectedPort?.id === port.id && <Check className="h-4 w-4 mr-1" />}
                        Available
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        In Use
                      </>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Date Selection */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Select Date</h3>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {dateOptions.map((dateOption) => (
              <Button
                key={dateOption.value}
                variant={selectedDate === dateOption.value ? "default" : "outline"}
                onClick={() => setSelectedDate(dateOption.value)}
                className="flex-shrink-0"
              >
                {dateOption.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Time Slot Selection */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Select Time Slot</h3>
          <TimeSlotPicker 
            selectedTimeSlot={selectedTimeSlot}
            onSelectTimeSlot={handleTimeSlotSelect}
            date={selectedDate}
            unavailableSlots={["14:00", "15:00"]} // This would come from the API in a real implementation
          />
        </div>
        
        {/* Duration Selection */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Select Duration</h3>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDurationChange(-10)}
              disabled={duration <= 30}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="px-6 py-2 border-t border-b border-gray-200 text-center">
              {duration} min
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDurationChange(10)}
              disabled={duration >= 120}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Booking Button */}
        <div id="booking-section">
          <Button 
            className="w-full py-6 mt-4"
            size="lg"
            disabled={!selectedPort || !selectedTimeSlot || !user}
            onClick={handleBookNowClick}
          >
            Book Charging Slot
          </Button>
        </div>
        
        {!user && (
          <p className="text-sm text-center text-gray-500 mt-2">
            Please log in to book a charging slot
          </p>
        )}
      </div>
      
      {/* Booking Form Modal */}
      {showBookingForm && selectedPort && selectedTimeSlot && (
        <BookingForm
          isOpen={showBookingForm}
          onClose={() => setShowBookingForm(false)}
          onSubmit={handleBookingSubmit}
          bookingDetails={{
            stationId: station.id,
            stationName: station.name,
            stationAddress: station.address,
            portId: selectedPort.id,
            portType: selectedPort.type,
            portPower: selectedPort.powerKw,
            portName: selectedPort.name,
            date: selectedDate,
            startTime: selectedTimeSlot,
            endTime: calculateEndTime(selectedTimeSlot),
            duration: duration,
            price: station.pricePerKwh,
          }}
        />
      )}
    </div>
  );
}
