import { Switch, Route } from "wouter"
import { Toaster } from "@/components/ui/toaster"
import NotFound from "@/pages/not-found"
import HomePage from "@/pages/home-page"
import AuthPage from "@/pages/auth-page"
import BookingsPage from "@/pages/bookings-page"
import { ProtectedRoute } from "./lib/protected-route"
import { AuthProvider } from "@/hooks/use-auth"
import AdminPage from "./pages/admin-page"
import OwnerRegistrationPage from "./pages/newstation"

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/bookings" component={BookingsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/newstation" component={OwnerRegistrationPage} />
      <Route path="/auth" component={AuthPage} />

      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  )
}

export default App
