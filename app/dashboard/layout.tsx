"use client"

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { PWAInstall } from '@/components/mobile/pwa-install'
import { OfflineIndicator } from '@/components/mobile/offline-indicator'
import { MobileOptimizations } from '@/components/mobile/mobile-optimizations'
import { TouchGestures } from '@/components/mobile/touch-gestures'
import { Toaster } from '@/components/ui/toaster'
import { useState, useEffect } from 'react'
import { authService } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    setIsLoading(false)

    if (!authenticated) {
      router.push('/')
    }
  }, [router])

  const handleSwipeLeft = () => {
    // Navigation logic can be handled here if needed
  }

  const handleSwipeRight = () => {
    // Navigation logic can be handled here if needed
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">ACCORD</div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileOptimizations />
      <OfflineIndicator />
      <PWAInstall />

      {/* Desktop Sidebar */}
      <DashboardSidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Mobile Navigation */}
      <MobileNav currentPage={currentPage} onPageChange={setCurrentPage} />

      <TouchGestures onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
        {/* Main Content with offset for sidebar on desktop */}
        <main className="lg:pl-64 min-h-screen">
          <div className="pb-16 lg:pb-0">
            {children}
          </div>
        </main>
      </TouchGestures>

      <Toaster />
    </div>
  )
}
