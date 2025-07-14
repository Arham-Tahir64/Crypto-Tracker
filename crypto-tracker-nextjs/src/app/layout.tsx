import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { GoogleOAuthProvider } from '@react-oauth/google';


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CryptoTracker - Portfolio Management",
  description: "Track your cryptocurrency portfolio with real-time data and analytics",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
