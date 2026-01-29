'use client'

import { AdminRole } from '@/lib/types'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  role: AdminRole
  email: string
}

export default function AdminLayout({ children, title, role, email }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} email={email} />
      <div className="flex-1 flex flex-col">
        <TopBar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
