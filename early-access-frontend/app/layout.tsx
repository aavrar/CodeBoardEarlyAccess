import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { PingProvider } from "@/components/ping-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CodeBoard - Early Access | Code-Switching Research Platform",
  description:
    "Join the waitlist for CodeBoard, the world's first community-driven code-switching corpus platform. Get researcher access for free!",
  keywords: "code-switching, linguistics, multilingual, research, corpus, early access",
  openGraph: {
    title: "CodeBoard - Early Access",
    description: "Be among the first to access the revolutionary code-switching research platform",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PingProvider>
          <AuthProvider>
            <main className="min-h-screen">{children}</main>
            <Toaster />
          </AuthProvider>
        </PingProvider>
      </body>
    </html>
  )
}
