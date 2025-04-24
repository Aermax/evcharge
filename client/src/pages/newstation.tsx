import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import Header from "@/components/header/header"

export default function OwnerRegistrationPage() {
  const { toast } = useToast()
  const [stationName, setStationName] = useState("")
  const [stationAddress, setStationAddress] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [email, setEmail] = useState("")
  const [vehicle, setVehicle] = useState("Tata Nexon EV Prime")
  const [portType, setPortType] = useState("AC")
  const [portPower, setPortPower] = useState(22) // Default value
  const [specialRequests, setSpecialRequests] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic form validation
    if (!stationName || !stationAddress || !contactNumber || !email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const stationData = {
      name: stationName,
      location: stationAddress,
      slots: Number(slots) || 0 // Convert to number
    }

    try {
      const res = await fetch("http://localhost:3000/api/stations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(stationData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      toast({
        title: "Success",
        description: "Station added successfully!"
      })

      // Optionally reset form fields
      setStationName("")
      setStationAddress("")
      setContactNumber("")
      setEmail("")
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error",
        description: err.message || "Failed to add station",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <Header />

      <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">
          New Station Registration
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Station Name */}
          <div>
            <Label htmlFor="stationName">Station Name</Label>
            <Input
              id="stationName"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              required
            />
          </div>

          {/* Station Address */}
          <div>
            <Label htmlFor="stationAddress">Station Address</Label>
            <Textarea
              id="stationAddress"
              value={stationAddress}
              onChange={(e) => setStationAddress(e.target.value)}
              required
            />
          </div>

          {/* Contact Number */}
          <div>
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Select Vehicle */}
          <div>
            <Label htmlFor="vehicle-select">Select Vehicle</Label>
            <Select value={vehicle} onValueChange={setVehicle}>
              <SelectTrigger id="vehicle-select">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tata Tiago EV">Tata Tiago EV</SelectItem>
                <SelectItem value="Tata Tigor EV">Tata Tigor EV</SelectItem>
                <SelectItem value="Tata Nexon EV Prime">
                  Tata Nexon EV Prime
                </SelectItem>
                <SelectItem value="MG ZS EV">MG ZS EV</SelectItem>
                <SelectItem value="Hyundai Kona Electric">
                  Hyundai Kona Electric
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Port Type */}
          <div>
            <Label htmlFor="portType">Port Type</Label>
            <Select value={portType} onValueChange={setPortType}>
              <SelectTrigger id="portType">
                <SelectValue placeholder="Select port type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">AC</SelectItem>
                <SelectItem value="DC">DC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Port Power */}
          <div>
            <Label htmlFor="portPower">Port Power (kW)</Label>
            <Input
              id="portPower"
              type="number"
              value={portPower}
              onChange={(e) => setPortPower(Number(e.target.value))}
              min="1"
              required
            />
          </div>

          {/* Special Requests */}
          <div>
            <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
            <Textarea
              id="specialRequests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="termsAccepted"
              checked={termsAccepted}
              onCheckedChange={(checked) =>
                setTermsAccepted(checked as boolean)
              }
            />
            <Label htmlFor="termsAccepted" className="text-sm">
              I accept the Terms and Conditions
            </Label>
          </div>

          {/* Submit Button */}
          <div>
            <Button type="submit" className="w-full" disabled={!termsAccepted}>
              Register Station
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
