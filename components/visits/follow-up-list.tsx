"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit,
  Eye,
  MapPin
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface FollowUp {
  _id: string;
  visitId: {
    _id: string;
    client: {
      name: string;
      location: string;
      type: string;
    };
    visitPurpose: string;
    date: string;
  };
  date: string;
  contactPerson: {
    name: string;
    role: string;
    phone?: string;
    email?: string;
  };
  outcome: "deal_sealed" | "in_progress" | "deal_failed";
  winningPoint?: string;
  progressNotes?: string;
  improvements?: string;
  failureReasons?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    region: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FollowUpListProps {
  visitId?: string;
  showVisitDetails?: boolean;
}

export function FollowUpList({ visitId, showVisitDetails = true }: FollowUpListProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: visitId ? ["followUpsByVisit", visitId] : ["followUps"],
    queryFn: () => visitId ? apiService.getFollowUpsByVisit(visitId) : apiService.getFollowUps(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteFollowUp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUps"] });
      queryClient.invalidateQueries({ queryKey: ["followUpsByVisit"] });
      setDeleteId(null);
    },
  });

  const followUps: FollowUp[] = response?.data || [];
  const stats = response?.stats;

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "deal_sealed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Deal Sealed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "deal_failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Deal Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading follow-ups...</div>
        </CardContent>
      </Card>
    );
  }

  if (!followUps.length) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            No follow-ups recorded yet. Create your first follow-up to track sales progress.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      {stats && (
        <Card className="bg-gradient-to-r from-[#008cf7]/10 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Follow-Up Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#008cf7]">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.byOutcome?.deal_sealed || 0}</div>
                <div className="text-sm text-gray-600">Sealed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.byOutcome?.in_progress || 0}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.byOutcome?.deal_failed || 0}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-Up Items */}
      <div className="space-y-3">
        {followUps.map((followUp) => (
          <Card
            key={followUp._id}
            className={`transition-all hover:shadow-md ${
              followUp.outcome === "deal_sealed"
                ? "border-l-4 border-l-green-500"
                : followUp.outcome === "deal_failed"
                ? "border-l-4 border-l-red-500"
                : "border-l-4 border-l-yellow-500"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getOutcomeBadge(followUp.outcome)}
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(followUp.date), "MMM dd, yyyy 'at' HH:mm")}
                    </div>
                  </div>

                  {showVisitDetails && followUp.visitId && (
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#008cf7]" />
                      {followUp.visitId.client.name}
                    </CardTitle>
                  )}

                  <CardDescription className="flex items-center gap-4 mt-1">
                    {showVisitDetails && followUp.visitId && (
                      <span>{followUp.visitId.client.location}</span>
                    )}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === followUp._id ? null : followUp._id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(followUp._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Contact Person */}
              <div className="flex items-start gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium">{followUp.contactPerson.name}</div>
                  {followUp.contactPerson.role && (
                    <div className="text-gray-600">{followUp.contactPerson.role}</div>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {followUp.contactPerson.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {followUp.contactPerson.phone}
                      </span>
                    )}
                    {followUp.contactPerson.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {followUp.contactPerson.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === followUp._id && (
                <div className="space-y-3 pt-3 border-t">
                  {followUp.outcome === "deal_sealed" && followUp.winningPoint && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-green-800 text-sm mb-1">Winning Point</div>
                          <div className="text-sm text-gray-700">{followUp.winningPoint}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {followUp.outcome === "in_progress" && (
                    <>
                      {followUp.progressNotes && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div>
                              <div className="font-semibold text-yellow-800 text-sm mb-1">Progress</div>
                              <div className="text-sm text-gray-700">{followUp.progressNotes}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {followUp.improvements && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <div className="font-semibold text-blue-800 text-sm mb-1">Improvements Needed</div>
                              <div className="text-sm text-gray-700">{followUp.improvements}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {followUp.outcome === "deal_failed" && followUp.failureReasons && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-red-800 text-sm mb-1">Failure Reasons</div>
                          <div className="text-sm text-gray-700">{followUp.failureReasons}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Created By */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <div>
                      Created by: {followUp.createdBy.firstName} {followUp.createdBy.lastName} ({followUp.createdBy.employeeId})
                    </div>
                    <div>
                      Region: {followUp.createdBy.region} • {format(new Date(followUp.createdAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Follow-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this follow-up record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
