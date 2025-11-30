// app/layout.tsx - Root Layout pour VETIC OPS

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VETIC OPS - Gestion Cabinet Dentaire',
  description: 'Système de gestion de patients et rendez-vous pour cabinets dentaires et médicaux',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen bg-dark-bg">
          {children}
        </div>
      </body>
    </html>
  )
}
