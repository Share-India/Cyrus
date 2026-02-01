import type React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "Share India | CYRUS Risk Protocol",
  description:
    "Cyber Underwriting Risk Simulator by Share India Insurance Brokers. IRDAI Licensed Direct Insurance Broker.",
  generator: "Share India",
  icons: {
    icon: [
      {
        url: "/share-india-new.png",
      },
    ],
  },
}

import { UnderwritingProvider } from "@/context/underwriting-context"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-inter antialiased`}>
        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        <UnderwritingProvider>
          {children}
          {/* Floating Monogram */}
          <div className="fixed bottom-6 right-6 z-50 opacity-40 hover:opacity-100 hover:scale-95 transition-all duration-300 ease-out cursor-pointer">
            <img src="/share-india-monogram.png" alt="Share India" className="w-14 h-14 md:w-16 md:h-16 drop-shadow-md" />
          </div>
        </UnderwritingProvider>
        <Analytics />
      </body>
    </html>
  )
}
