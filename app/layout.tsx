import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Análisis de Tráfico en Centro Comercial",
  description: "Sistema avanzado de monitoreo y análisis de afluencia en centros comerciales",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
