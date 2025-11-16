"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { TrailManagement } from "@/components/trails/trail-management"
import { VisitManagement } from "@/components/visits/visit-management"
import { FollowUpManager } from "@/components/visits/follow-up-manager"
import { MobileNav } from "@/components/layout/mobile-nav"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { PWAInstall } from "@/components/mobile/pwa-install"
import { OfflineIndicator } from "@/components/mobile/offline-indicator"
import { MobileOptimizations } from "@/components/mobile/mobile-optimizations"
import { TouchGestures } from "@/components/mobile/touch-gestures"
import { authService } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import { UserProfile } from "@/components/profile/user-profile"
import ReportsManager from "@/components/dashboard/reports"
import AdvancedAnalytics from "@/components/dashboard/advanced-analytics"
import LeadsList from "@/components/dashboard/leads"
import MachinesList from "@/components/dashboard/machines"
import UserManager from "@/components/dashboard/user-manager"
import PlannersManager from "@/components/dashboard/planners"
import SalesHeatmap from "@/components/dashboard/sales-heatmap"
import PerformanceAnalytics from "@/components/dashboard/performance-analytics"
import EngineerReports from "@/components/dashboard/engineer-reports"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState("dashboard")

  useEffect(() => {
    // Check if user is already authenticated
    setIsAuthenticated(authService.isAuthenticated())
    setIsLoading(false)
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleSwipeLeft = () => {
    const pages = ["dashboard", "visits", "trails", "follow-ups", "profile", "reports", "advanced-analytics", "leads", "machines", "user-manager", "planners", "sales-heatmap"]
    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex < pages.length - 1) {
      setCurrentPage(pages[currentIndex + 1])
    }
  }

  const handleSwipeRight = () => {
    const pages = ["dashboard", "visits", "trails", "follow-ups", "profile", "reports", "advanced-analytics", "leads", "machines", "user-manager", "planners", "sales-heatmap"]
    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex > 0) {
      setCurrentPage(pages[currentIndex - 1])
    }
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <MobileOptimizations />
        <OfflineIndicator />
        {showRegister ? (
          <RegisterForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onSuccess={handleAuthSuccess} onSwitchToRegister={() => setShowRegister(true)} />
        )}
        <Toaster />
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />
      case "visits":
        return <VisitManagement />
      case "trails":
        return <TrailManagement />
      case "follow-ups":
        return <FollowUpManager />
      case "profile":
        return <UserProfile />
      case "reports":
        return <ReportsManager />
      case "advanced-analytics":
        return <AdvancedAnalytics />
      case "leads":
        return <LeadsList />
      case "machines":
        return <MachinesList />
      case "user-manager":
        return <UserManager />
      case "planners":
        return <PlannersManager />
      case "sales-heatmap":
        return <SalesHeatmap />
      case "performance-analytics":
        return <PerformanceAnalytics />
      case "engineer-reports":
        return <EngineerReports />
      default:
        return <DashboardOverview />
    }
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
            {renderCurrentPage()}
          </div>
        </main>
      </TouchGestures>

      <Toaster />
    </div>
  )
}
