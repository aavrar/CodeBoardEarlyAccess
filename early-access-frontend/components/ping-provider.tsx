"use client"

import { useEffect } from "react"

export function PingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'
    
    // Only enable ping in production or when backend URL is a live service
    const isProduction = backendUrl.includes('render.com') || backendUrl.includes('onrender.com')
    
    if (!isProduction) {
      console.log('Ping service disabled for local development')
      return
    }

    // Ping the backend every 10 minutes to keep Render service active
    const pingInterval = setInterval(async () => {
      try {
        const response = await fetch(`${backendUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })
        
        if (response.ok) {
          console.log(`✅ Backend keep-alive ping successful: ${new Date().toISOString()}`)
        } else {
          console.warn(`⚠️ Backend ping failed with status: ${response.status}`)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          console.warn('⚠️ Backend ping timeout (5s)')
        } else {
          console.warn('⚠️ Backend ping error:', error instanceof Error ? error.message : error)
        }
      }
    }, 10 * 60 * 1000) // 10 minutes in milliseconds

    // Initial ping on mount (with detailed info)
    const initialPing = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/ping`, {
          signal: AbortSignal.timeout(10000), // 10 second timeout for initial ping
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('🚀 Backend connection established:', data)
        }
      } catch (error) {
        console.warn('⚠️ Initial backend ping failed:', error instanceof Error ? error.message : error)
      }
    }
    
    initialPing()

    console.log(`🔄 Backend keep-alive service started (10min intervals)`)

    // Cleanup interval on unmount
    return () => {
      clearInterval(pingInterval)
      console.log('🛑 Backend keep-alive service stopped')
    }
  }, [])

  return <>{children}</>
}