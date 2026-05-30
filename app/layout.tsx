import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'WealthIQ - Personal Wealth Intelligence Dashboard',
    template: '%s | WealthIQ',
  },
  description:
    'Track, analyze, and optimize your entire wealth portfolio in one intelligent dashboard. Real-time insights across all asset classes.',
  keywords: ['wealth management', 'portfolio tracker', 'net worth', 'financial dashboard', 'investment tracking'],
  authors: [{ name: 'WealthIQ' }],
  creator: 'WealthIQ',
  robots: {
    index: false, // Private app, don't index
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
