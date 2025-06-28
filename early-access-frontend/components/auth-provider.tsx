"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  name?: string
  tier: string
  authProvider: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const tier = urlParams.get('tier')
    const error = urlParams.get('error')

    if (token && tier) {
      // OAuth success - fetch user data
      fetchUserWithToken(token)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      // OAuth error
      let errorMessage = "Authentication failed."
      if (error === 'oauth_denied') {
        errorMessage = "Sign-in was cancelled."
      } else if (error === 'missing_code') {
        errorMessage = "Missing authentication code."
      } else if (error === 'no_email') {
        errorMessage = "Could not retrieve email from your account."
      } else if (error === 'server_error') {
        errorMessage = "Server error occurred during sign-in."
      }
      
      toast({
        title: "Sign-in failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      setIsLoading(false)
    } else {
      // Check for existing token in localStorage
      const storedToken = localStorage.getItem('codeboardToken')
      const storedUser = localStorage.getItem('codeboardUser')
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          // Verify token is still valid
          verifyToken(storedToken)
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          logout()
        }
      }
      setIsLoading(false)
    }
  }, [toast])

  const fetchUserWithToken = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'}/api/oauth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const userData = data.data
        setUser(userData)
        localStorage.setItem('codeboardToken', token)
        localStorage.setItem('codeboardUser', JSON.stringify(userData))
        
        toast({
          title: "Welcome back! 🎉",
          description: `Signed in successfully as ${userData.name || userData.email}`,
        })
      } else {
        throw new Error(data.message || 'Failed to fetch user data')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast({
        title: "Sign-in error",
        description: "Failed to retrieve your account information.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'}/api/oauth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Token invalid')
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      logout()
    }
  }

  const login = (token: string, userData: User) => {
    setUser(userData)
    localStorage.setItem('codeboardToken', token)
    localStorage.setItem('codeboardUser', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('codeboardToken')
    localStorage.removeItem('codeboardUser')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}