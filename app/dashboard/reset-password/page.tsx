"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [userIdOrEmail, setUserIdOrEmail] = useState("");
  const [method, setMethod] = useState<"link" | "temp">("link");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdOrEmail) {
      toast({ title: "Provide user id or email", description: "Enter user id or email to recover password", variant: "destructive" as any });
      return;
    }

    setLoading(true);
    try {
      // If user provided an email, attempt to resolve to id via apiService
      let targetId = userIdOrEmail;
      if (userIdOrEmail.includes("@")) {
        try {
          const usersResp = await apiService.getUsers({ email: userIdOrEmail, page: 1, limit: 1 });
          const user = (usersResp?.data || usersResp?.users || usersResp?.docs || [])[0];
          if (user && (user._id || user.id)) {
            targetId = user._id || user.id;
          }
        } catch (e) {
          // ignore - we'll try using the provided identifier directly
        }
      }

      const respPayload = await apiService.recoverUserPassword(targetId, method === "temp" ? { method: "temp" } : {});

      const payload = respPayload || {};

      toast({ title: "Success", description: payload?.message || "Password recovery initiated" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed", description: err?.message || "An error occurred", variant: "destructive" as any });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Reset Password (Admin)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">User ID or Email</label>
              <Input value={userIdOrEmail} onChange={(e) => setUserIdOrEmail(e.target.value)} placeholder="Enter user id or email" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Method</label>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setMethod("link")} className={`px-3 py-1 rounded ${method === "link" ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                  Send reset link
                </button>
                <button type="button" onClick={() => setMethod("temp")} className={`px-3 py-1 rounded ${method === "temp" ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                  Create temporary password
                </button>
              </div>
            </div>

            <div>
              <Button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Send'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
