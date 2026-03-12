import React from "react"
import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { KofiButton } from "@/components/kofi-button"
import { HowItWorksModal } from "@/components/how-it-works-modal"

import "./globals.css"

const _ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
})

export const metadata: Metadata = {
  title: "Library Scout",
  description:
    "Discover, save, and manage public library classes personalized to your interests.",
}

export const viewport: Viewport = {
  themeColor: "#c96b3c",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_ibmPlexMono.variable} font-mono antialiased`}>
        {children}
        <HowItWorksModal />
        <KofiButton />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
