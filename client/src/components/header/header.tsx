import { useState } from "react"
import { Link, useLocation } from "wouter"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bolt, Menu, X } from "lucide-react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [location] = useLocation()
  const { user, logoutMutation } = useAuth()

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.charAt(0).toUpperCase()
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Bolt className="h-8 w-8 text-primary" />
              <span className="font-semibold text-xl text-gray-900 ml-2">
                EVCharge
              </span>
            </Link>
            <nav className="hidden md:ml-6 md:flex space-x-8">
              <Link href="/">
                <a
                  className={`px-3 py-2 text-sm font-medium ${
                    location === "/"
                      ? "text-primary"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  Find Stations
                </a>
              </Link>
              <Link href="/bookings">
                <a
                  className={`px-3 py-2 text-sm font-medium ${
                    location === "/bookings"
                      ? "text-primary"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  My Bookings
                </a>
              </Link>
              <Link href="/newstation">
                <a
                  className={`px-3 py-2 text-sm font-medium ${
                    location === "/newstation"
                      ? "text-primary"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  Add New Station
                </a>
              </Link>
              <Link href="/admin">
                <a
                  className={`px-3 py-2 text-sm font-medium ${
                    location === "/admin"
                      ? "text-primary"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  Admin
                </a>
              </Link>
            </nav>
          </div>

          <div className="flex items-center">
            <div className="hidden md:flex items-center">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-white">
                          {getInitials(user.firstName || user.username)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.username}</p>
                        {user.email && (
                          <p className="w-[200px] truncate text-sm text-gray-600">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">
                        <a className="w-full cursor-pointer">My Bookings</a>
                      </Link>
                    </DropdownMenuItem>

                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <a className="w-full cursor-pointer">
                            Admin Dashboard
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {user.role === "stationOwner" && (
                      <DropdownMenuItem asChild>
                        <Link href="/station-owner">
                          <a className="w-full cursor-pointer">
                            Manage Stations
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleLogout}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="space-x-2">
                  <Link href="/auth">
                    <Button variant="ghost">Log In</Button>
                  </Link>
                  <Link href="/auth">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="text-gray-500"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/">
              <a
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location === "/"
                    ? "bg-primary-50 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                }`}
                onClick={() => setIsOpen(false)}
              >
                Find Stations
              </a>
            </Link>
            <Link href="/bookings">
              <a
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location === "/bookings"
                    ? "bg-primary-50 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                }`}
                onClick={() => setIsOpen(false)}
              >
                My Bookings
              </a>
            </Link>

            {user && user.role === "admin" && (
              <Link href="/admin">
                <a
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/admin"
                      ? "bg-primary-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Admin Dashboard
                </a>
              </Link>
            )}

            {user && user.role === "stationOwner" && (
              <Link href="/station-owner">
                <a
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === "/station-owner"
                      ? "bg-primary-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Manage Stations
                </a>
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="px-4 space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials(user.firstName || user.username)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.firstName
                        ? `${user.firstName} ${user.lastName || ""}`
                        : user.username}
                    </div>
                    {user.email && (
                      <div className="text-sm font-medium text-gray-500">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                >
                  Log out
                </Button>
              </div>
            ) : (
              <div className="px-4 flex flex-col space-y-2">
                <Link href="/auth">
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="w-full"
                    variant="outline"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button onClick={() => setIsOpen(false)} className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
