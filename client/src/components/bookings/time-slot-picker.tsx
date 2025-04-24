import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  selectedTimeSlot: string | null;
  onSelectTimeSlot: (timeSlot: string) => void;
  date: string;
  unavailableSlots?: string[];
}

export default function TimeSlotPicker({
  selectedTimeSlot,
  onSelectTimeSlot,
  date,
  unavailableSlots = []
}: TimeSlotPickerProps) {
  // Generate time slots from 8 AM to 8 PM
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const formattedHour = hour.toString().padStart(2, '0');
      const timeString = `${formattedHour}:00`;
      const displayTime = hour > 12 
        ? `${hour - 12}:00 PM` 
        : hour === 12
          ? '12:00 PM'
          : `${hour}:00 AM`;
      
      slots.push({
        time: timeString,
        display: displayTime,
        isAvailable: !unavailableSlots.includes(timeString)
      });
    }
    return slots;
  }, [unavailableSlots]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {timeSlots.map((slot) => (
        <div
          key={slot.time}
          className={cn(
            "py-3 px-2 text-center rounded-md cursor-pointer transition-all duration-200",
            slot.isAvailable
              ? selectedTimeSlot === slot.time
                ? "bg-primary text-white"
                : "bg-white border border-gray-300 hover:bg-gray-100"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
          onClick={() => slot.isAvailable && onSelectTimeSlot(slot.time)}
        >
          {slot.display}
        </div>
      ))}
    </div>
  );
}
