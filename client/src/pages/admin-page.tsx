import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { Redirect } from "wouter"
import { Booking, Station, User } from "@shared/schema"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Users,
  BatteryCharging,
  Calendar,
  DollarSign,
  Edit,
  Trash
} from "lucide-react"

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [adminPassword, setAdminPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState("users")

  // Check if user is authenticated
  if (!user) {
    return <Redirect to="/auth" />
  }

  // Authentication check for admin
  const handleAdminLogin = () => {
    if (adminPassword === "123") {
      setAuthenticated(true)
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin dashboard"
      })
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect admin password",
        variant: "destructive"
      })
    }
  }

  // Fetch users data
  const {
    data: users,
    isLoading: isLoadingUsers,
    isError: isUsersError
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      if (!authenticated) return []
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
    enabled: authenticated
  })

  // Fetch stations data
  const {
    data: stations,
    isLoading: isLoadingStations,
    isError: isStationsError
  } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
    queryFn: async () => {
      if (!authenticated) return []
      const res = await fetch("/api/stations")
      if (!res.ok) throw new Error("Failed to fetch stations")
      return res.json()
    },
    enabled: authenticated
  })

  // Fetch bookings data
  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isError: isBookingsError
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/all"],
    queryFn: async () => {
      if (!authenticated) return []
      const res = await fetch("/api/bookings/all")
      if (!res.ok) throw new Error("Failed to fetch bookings")
      return res.json()
    },
    enabled: authenticated
  })

  // Admin login form
  if (!authenticated) {
    return (
      <div className="container max-w-md mx-auto my-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription>
              Enter the admin password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleAdminLogin}>
              Login as Admin
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Loading state
  const isLoading = isLoadingUsers || isLoadingStations || isLoadingBookings
  const isError = isUsersError && isStationsError && isBookingsError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto my-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-2">Failed to load admin dashboard data.</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto my-6 px-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Badge variant="outline" className="text-sm">
            Logged in as {user.username}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{users?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stations
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
                Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {bookings?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  ₹{calculateTotalRevenue(bookings || [])}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue="users"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="stations">Stations</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>List of all registered users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "destructive"
                                : user.role === "stationOwner"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {user.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt || "").toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete User"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!users || users.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground h-24"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Station Management</CardTitle>
                <CardDescription>
                  Manage charging stations and their details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>List of all charging stations</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Price/kWh</TableHead>
                      <TableHead>Power</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stations?.map((station) => (
                      <TableRow key={station.id}>
                        <TableCell>{station.id}</TableCell>
                        <TableCell>{station.name}</TableCell>
                        <TableCell>{station.address}</TableCell>
                        <TableCell>₹{station.pricePerKwh}</TableCell>
                        <TableCell>{station.powerKw}kW</TableCell>
                        <TableCell>
                          {findOwnerName(users || [], station.ownerId)}
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
                              title="Delete Station"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!stations || stations.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground h-24"
                        >
                          No stations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>
                  Track all bookings across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>List of all bookings</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.id}</TableCell>
                        <TableCell>
                          {findUserName(users || [], booking.userId)}
                        </TableCell>
                        <TableCell>
                          {findStationName(stations || [], booking.stationId)}
                        </TableCell>
                        <TableCell>{booking.date}</TableCell>
                        <TableCell>
                          {booking.startTime} - {booking.endTime}
                        </TableCell>
                        <TableCell>{booking.duration} min</TableCell>
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
                    {(!bookings || bookings.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground h-24"
                        >
                          No bookings found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Helper functions
function calculateTotalRevenue(bookings: Booking[]): string {
  // In a real application, this would calculate actual payment amounts
  return bookings
    .filter(
      (booking) =>
        booking.status === "completed" || booking.status === "confirmed"
    )
    .reduce((total, booking) => {
      // Assume an average price of ₹200 per booking
      return total + 200
    }, 0)
    .toFixed(2)
}

function findUserName(users: User[], userId: number): string {
  const user = users.find((u) => u.id === userId)
  return user
    ? `${user.firstName || ""} ${user.lastName || ""} (${user.username})`
    : `User #${userId}`
}

function findStationName(stations: Station[], stationId: number): string {
  const station = stations.find((s) => s.id === stationId)
  return station ? station.name : `Station #${stationId}`
}

function findOwnerName(users: User[], ownerId?: number | null): string {
  if (!ownerId) return "No owner"
  const owner = users.find((u) => u.id === ownerId)
  return owner ? owner.username : `Owner #${ownerId}`
}
