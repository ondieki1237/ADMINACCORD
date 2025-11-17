"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { hasAdminAccess, canViewHeatmap } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Clock, 
  FileText, 
  TrendingUp, 
  UserPlus, 
  Settings, 
  Calendar,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Star,
  CalendarCheck
} from "lucide-react";

interface DashboardSidebarProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export function DashboardSidebar({ currentPage = "dashboard", onPageChange }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = React.useState(authService.getCurrentUserSync());
  const router = useRouter();

  React.useEffect(() => {
    if (!currentUser) {
      authService.getCurrentUser().then(setCurrentUser).catch(console.error);
    }
  }, [currentUser]);

  const handleNavigation = (path: string) => {
    if (onPageChange) {
      // Strip /dashboard/ prefix for state-based navigation
      const pageName = path.replace('/dashboard/', '').replace('/dashboard', 'dashboard');
      onPageChange(pageName);
    } else {
      router.push(path);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/");
  };

  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: "/dashboard",
      color: "text-[#008cf7]",
      bgColor: "bg-blue-50"
    },
    { 
      icon: CalendarCheck, 
      label: "Daily Reports", 
      path: "/dashboard/daily-reports",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    { 
      icon: TrendingUp, 
      label: "Performance", 
      path: "/dashboard/performance-analytics",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    { 
      icon: Shield, 
      label: "Engineer Reports", 
      path: "/dashboard/engineer-reports",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    { 
      icon: FileText, 
      label: "Sales Reports", 
      path: "/dashboard/reports",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    { 
      icon: BarChart3, 
      label: "Analytics", 
      path: "/dashboard/advanced-analytics",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
  ];

  const quickActions = [
    { 
      icon: UserPlus, 
      label: "Leads", 
      path: "/dashboard/leads",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    { 
      icon: Settings, 
      label: "Machines", 
      path: "/dashboard/machines",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    { 
      icon: Users, 
      label: "Users", 
      path: "/dashboard/user-manager",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    { 
      icon: Calendar, 
      label: "Planners", 
      path: "/dashboard/planners",
      color: "text-gray-900",
      bgColor: "bg-gray-100"
    },
  ];

  // Add Sales Heatmap if user has permission
  if (canViewHeatmap(currentUser)) {
    quickActions.unshift({ 
      icon: MapPin, 
      label: "Heatmap", 
      path: "/dashboard/sales-heatmap",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    });
  }

  const favorites = [
    { icon: Star, label: "Top Customers", path: "/dashboard/customers" },
    { icon: Clock, label: "Visits", path: "/dashboard/visits" },
    { icon: MapPin, label: "Trails", path: "/dashboard/trails" },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 transition-all duration-300 z-40 ${
        isCollapsed ? "w-20" : "w-64"
      } hidden lg:block`}
    >
      <div className="flex flex-col h-full">
        {/* Header with Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center shadow-lg">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ACCORD</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && currentUser && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center text-white font-semibold">
                {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Main Navigation */}
          <div className="px-3 mb-6">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Main Menu
              </p>
            )}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.path || currentPage === item.path.replace('/dashboard/', '');
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? `${item.bgColor} ${item.color} shadow-sm`
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`flex-shrink-0 ${isCollapsed ? "mx-auto" : ""}`}>
                      <Icon className={`h-5 w-5 ${isActive ? item.color : "text-gray-400 group-hover:text-gray-600"}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions */}
          <div className="px-3 mb-6">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Quick Actions
              </p>
            )}
            <nav className="space-y-1">
              {quickActions.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.path || currentPage === item.path.replace('/dashboard/', '');
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? `${item.bgColor} ${item.color} shadow-sm`
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`flex-shrink-0 ${isCollapsed ? "mx-auto" : ""}`}>
                      <Icon className={`h-5 w-5 ${isActive ? item.color : "text-gray-400 group-hover:text-gray-600"}`} />
                    </div>
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Favorites */}
          {!isCollapsed && (
            <div className="px-3">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Favorites
              </p>
              <nav className="space-y-1">
                {favorites.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-gray-600 hover:bg-gray-50"
                    >
                      <Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full ${
              isCollapsed 
                ? "p-2 justify-center" 
                : "justify-start gap-3"
            } text-gray-600 hover:text-red-600 hover:bg-red-50`}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
