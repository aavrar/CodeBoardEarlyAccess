"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoginModal } from "@/components/login-modal"
import { Globe, Menu, X, LogIn } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"

export function AppNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/contribute", label: "Contribute" },
    { href: "#about", label: "About" },
  ]

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">CodeBoard</span>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              Early Access
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-teal-600",
                  pathname === item.href ? "text-teal-600 border-b-2 border-teal-600 pb-1" : "text-neutral-600",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-neutral-600">
                    Welcome, {user.name || user.email.split('@')[0]}!
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout} className="text-neutral-600 hover:text-red-600">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <LoginModal>
                    <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-teal-600">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </LoginModal>
                  <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
                    <Link href="/#signup">Join Early Access</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 text-base font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "text-teal-600 bg-teal-50"
                      : "text-neutral-600 hover:text-teal-600 hover:bg-neutral-50",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-3 py-2 space-y-2">
                {user ? (
                  <>
                    <div className="text-sm text-neutral-600 px-3 py-2">
                      Welcome, {user.name || user.email.split('@')[0]}!
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { logout(); setIsOpen(false); }} className="w-full text-neutral-600 hover:text-red-600">
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <LoginModal>
                      <Button variant="ghost" size="sm" className="w-full text-neutral-600 hover:text-teal-600" onClick={() => setIsOpen(false)}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Button>
                    </LoginModal>
                    <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 w-full">
                      <Link href="/#signup" onClick={() => setIsOpen(false)}>Join Early Access</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}