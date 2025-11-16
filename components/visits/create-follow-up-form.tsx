"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Phone, Mail, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateFollowUpFormProps {
  visitId: string;
  visitDetails?: {
    client?: {
      name: string;
      location: string;
    };
    date?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateFollowUpForm({ visitId, visitDetails, onSuccess, onCancel }: CreateFollowUpFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    contactPerson: {
      name: "",
      role: "",
      phone: "",
      email: "",
    },
    outcome: "in_progress" as "deal_sealed" | "in_progress" | "deal_failed",
    winningPoint: "",
    progressNotes: "",
    improvements: "",
    failureReasons: "",
  });

  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        visitId,
        date: formData.date,
        contactPerson: formData.contactPerson,
        outcome: formData.outcome,
        ...(formData.outcome === "deal_sealed" && { winningPoint: formData.winningPoint }),
        ...(formData.outcome === "in_progress" && {
          progressNotes: formData.progressNotes,
          improvements: formData.improvements,
        }),
        ...(formData.outcome === "deal_failed" && { failureReasons: formData.failureReasons }),
      };
      return apiService.createFollowUp(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUps"] });
      queryClient.invalidateQueries({ queryKey: ["followUpsByVisit", visitId] });
      onSuccess?.();
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create follow-up");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.contactPerson.name.trim()) {
      setError("Contact person name is required");
      return;
    }

    if (formData.outcome === "deal_sealed" && !formData.winningPoint.trim()) {
      setError("Please explain what was the winning point for this sealed deal");
      return;
    }

    if (formData.outcome === "in_progress" && !formData.progressNotes.trim()) {
      setError("Please explain the progress made so far");
      return;
    }

    if (formData.outcome === "deal_failed" && !formData.failureReasons.trim()) {
      setError("Please explain the reasons for deal failure");
      return;
    }

    createMutation.mutate();
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateContactField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contactPerson: { ...prev.contactPerson, [field]: value },
    }));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#008cf7]" />
          Create Follow-Up
        </CardTitle>
        <CardDescription>
          Record follow-up activity for {visitDetails?.client?.name || "this visit"}
        </CardDescription>
        {visitDetails && (
          <div className="mt-2 text-sm text-gray-600">
            <p><strong>Location:</strong> {visitDetails.client?.location}</p>
            <p><strong>Initial Visit:</strong> {visitDetails.date ? new Date(visitDetails.date).toLocaleDateString() : "N/A"}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Follow-up Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Follow-Up Date & Time
            </Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => updateField("date", e.target.value)}
              required
            />
          </div>

          {/* Contact Person Details */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Person
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Name *</Label>
                <Input
                  id="contactName"
                  value={formData.contactPerson.name}
                  onChange={(e) => updateContactField("name", e.target.value)}
                  placeholder="e.g., Dr. Jane Mwangi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactRole">Role</Label>
                <Input
                  id="contactRole"
                  value={formData.contactPerson.role}
                  onChange={(e) => updateContactField("role", e.target.value)}
                  placeholder="e.g., CEO, Procurement Manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPerson.phone}
                  onChange={(e) => updateContactField("phone", e.target.value)}
                  placeholder="+254712345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactPerson.email}
                  onChange={(e) => updateContactField("email", e.target.value)}
                  placeholder="contact@hospital.com"
                />
              </div>
            </div>
          </div>

          {/* Outcome Selection */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome *</Label>
            <Select value={formData.outcome} onValueChange={(value: any) => updateField("outcome", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deal_sealed">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Deal Sealed
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    In Progress
                  </div>
                </SelectItem>
                <SelectItem value="deal_failed">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Deal Failed
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields Based on Outcome */}
          {formData.outcome === "deal_sealed" && (
            <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
              <Label htmlFor="winningPoint" className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                What Was the Winning Point? *
              </Label>
              <Textarea
                id="winningPoint"
                value={formData.winningPoint}
                onChange={(e) => updateField("winningPoint", e.target.value)}
                placeholder="Explain what made the deal successful: competitive pricing, product quality, relationship, service, etc."
                rows={4}
                className="bg-white"
                required
              />
            </div>
          )}

          {formData.outcome === "in_progress" && (
            <div className="space-y-4">
              <div className="space-y-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Label htmlFor="progressNotes" className="flex items-center gap-2 text-yellow-800">
                  <Clock className="h-4 w-4" />
                  Explain the Progress *
                </Label>
                <Textarea
                  id="progressNotes"
                  value={formData.progressNotes}
                  onChange={(e) => updateField("progressNotes", e.target.value)}
                  placeholder="Describe the current status: what has been agreed, next steps, timeline, pending approvals, etc."
                  rows={4}
                  className="bg-white"
                  required
                />
              </div>

              <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label htmlFor="improvements" className="flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-4 w-4" />
                  Any Improvements Needed?
                </Label>
                <Textarea
                  id="improvements"
                  value={formData.improvements}
                  onChange={(e) => updateField("improvements", e.target.value)}
                  placeholder="Suggest improvements: better pricing, additional features, faster delivery, enhanced support, etc."
                  rows={3}
                  className="bg-white"
                />
              </div>
            </div>
          )}

          {formData.outcome === "deal_failed" && (
            <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
              <Label htmlFor="failureReasons" className="flex items-center gap-2 text-red-800">
                <TrendingDown className="h-4 w-4" />
                What Was the Downside/Failure Reasons? *
              </Label>
              <Textarea
                id="failureReasons"
                value={formData.failureReasons}
                onChange={(e) => updateField("failureReasons", e.target.value)}
                placeholder="Explain why the deal failed: pricing issues, competitor advantages, product limitations, timing, budget constraints, etc."
                rows={4}
                className="bg-white"
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[#008cf7] hover:bg-[#006bb8]"
            >
              {createMutation.isPending ? "Creating..." : "Create Follow-Up"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
