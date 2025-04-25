import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  Bolt,
  DollarSign,
  Car,
  CreditCard,
  Loader2,
  IndianRupee,
  Smartphone
} from "lucide-react"

interface BookingFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (bookingData: any) => void
  bookingDetails: {
    stationId: number
    stationName: string
    stationAddress: string
    portId: number
    portType: string
    portPower: number
    portName: string
    date: string
    startTime: string
    endTime: string
    duration: number
    price: string
  }
}

export default function BookingForm({
  isOpen,
  onClose,
  onSubmit,
  bookingDetails
}: BookingFormProps) {
  const { toast } = useToast()
  const [vehicle, setVehicle] = useState("Tesla Model 3 (ABC123)")
  const [specialRequests, setSpecialRequests] = useState("")
  const [sendReminder, setSendReminder] = useState(true)
  const [step, setStep] = useState(1) // 1: details, 2: payment
  const [upiId, setUpiId] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bookings", data)
      return await res.json()
    },
    onSuccess: (data) => {
      // Clear form
      setVehicle("Tesla Model 3 (ABC123)")
      setSpecialRequests("")
      setSendReminder(true)
      setStep(1)
      setUpiId("")

      // Invalidate bookings query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] })

      // Notify parent about submission
      onSubmit(data)
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description:
          error.message || "Could not complete your booking. Please try again.",
        variant: "destructive"
      })
    }
  })

  // Process payment using UPI (dummy implementation)
  const processPayment = () => {
    if (!upiId) {
      toast({
        title: "Missing Information",
        description: "Please enter your UPI ID",
        variant: "destructive"
      })
      return
    }

    // Simulate UPI ID validation
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/
    if (!upiRegex.test(upiId)) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID (e.g., username@bank)",
        variant: "destructive"
      })
      return
    }

    // Calculate payment amount
    const pricePerKwh = parseFloat(bookingDetails.price)
    const power = bookingDetails.portPower
    const hours = bookingDetails.duration / 60
    const amount = Math.round(pricePerKwh * power * hours * 0.85) // Average estimation

    // Simulate payment processing
    setIsProcessingPayment(true)

    // Create booking with UPI payment info
    setTimeout(() => {
      const bookingData = {
        stationId: bookingDetails.stationId,
        portId: bookingDetails.portId,
        date: bookingDetails.date,
        startTime: bookingDetails.startTime,
        endTime: bookingDetails.endTime,
        duration: bookingDetails.duration,
        status: "confirmed", // Mark as confirmed since payment was successful
        vehicleInfo: vehicle,
        specialRequests: specialRequests,
        paymentMethod: "upi",
        upiId: upiId,
        paymentAmount: amount
      }

      setIsProcessingPayment(false)
      bookingMutation.mutate(bookingData)
    }, 1500) // Simulate 1.5s payment processing
  }

  // Handle next step
  const handleNextStep = () => {
    setStep(2)
  }

  // Handle back to details
  const handleBackToDetails = () => {
    setStep(1)
  }

  // Handle form submission
  const handleSubmit = () => {
    if (step === 1) {
      handleNextStep()
    } else {
      processPayment()
    }
  }

  // Calculate estimated price
  const estimatedPrice = () => {
    const pricePerKwh = parseFloat(bookingDetails.price)
    const power = bookingDetails.portPower
    const hours = bookingDetails.duration / 60

    // Estimate: some EVs can't utilize full power, so use 80-90% efficiency
    const minPrice = Math.round(pricePerKwh * power * hours * 0.8)

    return `₹${minPrice}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md z-50">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 1 ? "Confirm Booking" : "Payment Details"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Review the details of your charging session"
              : "Complete payment to confirm your booking"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <h3 className="font-medium text-lg text-gray-900">
                {bookingDetails.stationName}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {bookingDetails.stationAddress}
              </p>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{bookingDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {bookingDetails.startTime} - {bookingDetails.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {bookingDetails.duration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Port:</span>
                  <span className="font-medium">
                    {bookingDetails.portType} {bookingDetails.portName} (
                    {bookingDetails.portPower}kW)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">
                    ₹{bookingDetails.price}/kWh (estimated {estimatedPrice()})
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-select">Select Vehicle</Label>
                <Select value="Tata Nexon EV Prime" onValueChange={setVehicle}>
                  <SelectTrigger id="vehicle-select">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>

                  <SelectContent>
                    {/* Affordable Segment */}
                    <SelectItem value="Tata Tiago EV">Tata Tiago EV</SelectItem>
                    <SelectItem value="Tata Tigor EV">Tata Tigor EV</SelectItem>
                    <SelectItem value="MG Comet EV">MG Comet EV</SelectItem>
                    <SelectItem value="Citroën eC3">Citroën eC3</SelectItem>
                    <SelectItem value="Mahindra eVerito">
                      Mahindra eVerito
                    </SelectItem>

                    {/* Mid-Range Segment */}
                    <SelectItem value="Tata Nexon EV Prime">
                      Tata Nexon EV Prime
                    </SelectItem>
                    <SelectItem value="Tata Nexon EV Max">
                      Tata Nexon EV Max
                    </SelectItem>
                    <SelectItem value="MG ZS EV">MG ZS EV</SelectItem>
                    <SelectItem value="Hyundai Kona Electric">
                      Hyundai Kona Electric
                    </SelectItem>

                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special-requests">
                  Special Requests (optional)
                </Label>
                <Textarea
                  id="special-requests"
                  placeholder="Any special instructions..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder"
                  checked={sendReminder}
                  onCheckedChange={(checked) =>
                    setSendReminder(checked as boolean)
                  }
                />
                <Label htmlFor="reminder" className="text-sm">
                  Send me a reminder 30 minutes before
                </Label>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-col gap-2">
              <Button onClick={handleSubmit} className="w-full">
                Proceed to Payment
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Payment Form */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-lg">{estimatedPrice()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-md bg-amber-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <IndianRupee className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        Pay with UPI
                      </h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p>Make payment directly using your UPI ID</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <div className="relative">
                    <Input
                      id="upi-id"
                      placeholder="yourname@bank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <Smartphone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    For example: name@okicici, user@ybl, phone@paytm
                  </p>
                </div>

                <div className="pt-2">
                  <div className="rounded-md bg-green-50 p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Bolt className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Instant payments using UPI
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-col gap-2">
              {isProcessingPayment ? (
                <Button disabled className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={bookingMutation.isPending}
                  >
                    {bookingMutation.isPending
                      ? "Booking..."
                      : "Pay and Confirm"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBackToDetails}
                    className="w-full"
                  >
                    Back to Details
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
