"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  CalendarCheck,
  TrendingUp,
  Shield,
  BarChart3,
  FileText,
  UserPlus,
  Settings,
  Package,
  Phone,
  Users,
  Calendar,
  Menu,
  LogOut,
  ClipboardList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface MobileNavProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function MobileNav({ currentPage, onPageChange }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const mainMenu = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "daily-reports", label: "Daily Reports", icon: CalendarCheck, path: "/dashboard/daily-reports" },
    { id: "performance", label: "Performance", icon: TrendingUp, path: "/dashboard/performance-analytics" },
    { id: "engineer-reports", label: "Engineer Reports", icon: Shield, path: "/dashboard/engineer-reports" },
    { id: "advanced-analytics", label: "Analytics", icon: BarChart3, path: "/dashboard/advanced-analytics" },
    { id: "reports", label: "Weekly Reports", icon: FileText, path: "/dashboard/reports" },
    { id: "machine-documents", label: "Documentations", icon: FileText, path: "/dashboard/machine-documents" },
    { id: "service-requests", label: "Service Requests", icon: ClipboardList, path: "/dashboard/service-requests" },
  ]

  const quickActions = [
    { id: "leads", label: "Leads", icon: UserPlus, path: "/dashboard/leads" },
    { id: "machines", label: "Machines", icon: Settings, path: "/dashboard/machines" },
    { id: "consumables", label: "Consumables", icon: Package, path: "/dashboard/consumables" },
    { id: "telesales", label: "Telesales", icon: Phone, path: "/dashboard/telesales" },
    { id: "user-manager", label: "Users", icon: Users, path: "/dashboard/user-manager" },
    { id: "planners", label: "Planners", icon: Calendar, path: "/dashboard/planners" },
  ]

  const handleLogout = async () => {
    try {
      await authService.logout()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
      window.location.reload()
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden neumorphic-card mx-4 mt-4 mb-2 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">ACCORD</h1>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="neumorphic-button">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col h-full">
                <div className="py-4">
                  <h2 className="text-lg font-semibold text-primary">ACCORD</h2>
                </div>
                <nav className="flex-1 overflow-y-auto pr-2">
                  <div className="mb-4">
                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Main Menu
                    </p>
                    <div className="space-y-1">
                      {mainMenu.map((item) => {
                        const Icon = item.icon
                        const isActive = currentPage === item.id
                        return (
                          <Button
                            key={item.id}
                            variant={isActive ? "default" : "ghost"}
                            className={`w-full justify-start h-10 ${isActive ? "bg-[#0089f4] text-white" : "text-gray-600 hover:bg-blue-50 hover:text-[#0089f4]"}`}
                            onClick={() => {
                              onPageChange(item.id)
                              setIsOpen(false)
                            }}
                          >
                            <Icon className="mr-3 h-4 w-4" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Quick Actions
                    </p>
                    <div className="space-y-1">
                      {quickActions.map((item) => {
                        const Icon = item.icon
                        const isActive = currentPage === item.id
                        return (
                          <Button
                            key={item.id}
                            variant={isActive ? "default" : "ghost"}
                            className={`w-full justify-start h-10 ${isActive ? "bg-[#0089f4] text-white" : "text-gray-600 hover:bg-blue-50 hover:text-[#0089f4]"}`}
                            onClick={() => {
                              onPageChange(item.id)
                              setIsOpen(false)
                            }}
                          >
                            <Icon className="mr-3 h-4 w-4" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </nav>
                <div className="pt-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive neumorphic-button"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

    </>
  )
}
