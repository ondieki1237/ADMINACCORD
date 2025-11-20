"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DesktopHeader() {
  const handleLogout = async () => {
    await authService.logout();
    // reload to ensure unauthenticated state is picked up by app
    if (typeof window !== "undefined") window.location.reload();
  };

  const user = authService.getCurrentUserSync?.();

  return (
    <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-background border-b">
      <div className="flex items-center gap-4">
        <div className="text-xl font-semibold text-primary">ACCORD Admin</div>
        <div className="text-sm text-muted-foreground">Desktop Dashboard</div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => window.location.reload()}>
          Refresh
        </Button>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>{user ? `${user.firstName?.[0] ?? "U"}` : "U"}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium">{user ? `${user.firstName} ${user.lastName}` : "User"}</div>
            <div className="text-muted-foreground">{user?.role ?? "Member"}</div>
          </div>
        </div>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
