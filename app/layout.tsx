import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '5thVital Admin',
  description: 'Admin Dashboard for 5thVital',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
