"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateFollowUpForm } from "./create-follow-up-form";
import { FollowUpList } from "./follow-up-list";
import { Plus, Filter, Download, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FollowUpManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [filters, setFilters] = useState({
    outcome: "",
    startDate: "",
    endDate: "",
    userId: "",
  });

  const { data: visitsResponse } = useQuery({
    queryKey: ["visits"],
    queryFn: () => apiService.getVisits(1, 100),
  });

  const visits = visitsResponse?.data || [];
  const salesVisits = visits.filter((v: any) => v.visitPurpose?.toLowerCase() === "sales");

  const handleCreateFollowUp = (visit: any) => {
    setSelectedVisit(visit);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setSelectedVisit(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#008cf7] to-[#006bb8] text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Follow-Up Management
          </CardTitle>
          <CardDescription className="text-white/90">
            Track and manage sales follow-ups to monitor deal progress and outcomes
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Follow-Ups</TabsTrigger>
            <TabsTrigger value="sealed">Deal Sealed</TabsTrigger>
            <TabsTrigger value="progress">In Progress</TabsTrigger>
            <TabsTrigger value="failed">Deal Failed</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implement export */}}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select value={filters.outcome} onValueChange={(value) => setFilters({ ...filters, outcome: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All outcomes</SelectItem>
                    <SelectItem value="deal_sealed">Deal Sealed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="deal_failed">Deal Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ outcome: "", startDate: "", endDate: "", userId: "" })}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Follow-Ups */}
        <TabsContent value="all" className="space-y-4">
          <FollowUpList showVisitDetails={true} />
        </TabsContent>

        {/* Deal Sealed */}
        <TabsContent value="sealed" className="space-y-4">
          <FollowUpList showVisitDetails={true} />
        </TabsContent>

        {/* In Progress */}
        <TabsContent value="progress" className="space-y-4">
          <FollowUpList showVisitDetails={true} />
        </TabsContent>

        {/* Deal Failed */}
        <TabsContent value="failed" className="space-y-4">
          <FollowUpList showVisitDetails={true} />
        </TabsContent>
      </Tabs>

      {/* Sales Visits - Quick Create Follow-Up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Follow-Up from Sales Visit
          </CardTitle>
          <CardDescription>
            Select a sales visit to create a follow-up record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {salesVisits.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No sales visits found. Create a sales visit first.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {salesVisits.slice(0, 6).map((visit: any) => (
                  <Card
                    key={visit._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCreateFollowUp(visit)}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="font-semibold text-sm">{visit.client?.name || "Unknown Client"}</div>
                        <div className="text-xs text-gray-600">{visit.client?.location || "N/A"}</div>
                        <div className="text-xs text-gray-500">
                          {visit.date ? new Date(visit.date).toLocaleDateString() : "No date"}
                        </div>
                        <Button size="sm" className="w-full mt-2">
                          <Plus className="h-3 w-3 mr-1" />
                          Create Follow-Up
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Follow-Up Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Follow-Up</DialogTitle>
            <DialogDescription>
              Record follow-up details for this sales visit
            </DialogDescription>
          </DialogHeader>
          {selectedVisit && (
            <CreateFollowUpForm
              visitId={selectedVisit._id}
              visitDetails={{
                client: selectedVisit.client,
                date: selectedVisit.date,
              }}
              onSuccess={handleCloseForm}
              onCancel={handleCloseForm}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
