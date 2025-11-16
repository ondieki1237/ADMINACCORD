"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, Clock, Calendar, ArrowLeft, FileText, Phone, Mail, Plus, AlertCircle, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateFollowUpForm } from "./create-follow-up-form"
import { FollowUpList } from "./follow-up-list"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Visit {
  id?: string
  _id?: string
  date: string
  startTime: string
  endTime: string
  client: {
    name: string
  }
  contacts: any[]
  requestedEquipment: any[]
  notes: string
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
  visitPurpose?: string
}

interface VisitDetailProps {
  visit: Visit
  onBack: () => void
}

interface FollowUp {
  action: string
  assignedTo: string
  dueDate: string
  priority: "low" | "medium" | "high"
}

export function VisitDetail({ visit, onBack }: VisitDetailProps) {
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const [showSalesFollowUp, setShowSalesFollowUp] = useState(false)
  const [followUp, setFollowUp] = useState<FollowUp>({
    action: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
  })
  const { toast } = useToast()
  
  // Get the visit ID (could be _id or id)
  const visitId = visit._id || visit.id || ""
  
  // Check if this is a sales visit
  const isSalesVisit = visit.visitPurpose?.toLowerCase() === "sales"

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const getVisitStatus = (visit: Visit) => {
    const now = new Date()
    const visitStart = new Date(visit.startTime)
    const visitEnd = new Date(visit.endTime)

    if (visit.status) return visit.status

    if (now < visitStart) return "scheduled"
    if (now >= visitStart && now <= visitEnd) return "in-progress"
    return "completed"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // In a real app, this would call the API
      // await apiService.addFollowUp(visit.id, followUp)

      toast({
        title: "Follow-up created",
        description: "Follow-up action has been scheduled successfully.",
      })

      setShowFollowUpForm(false)
      setFollowUp({
        action: "",
        assignedTo: "",
        dueDate: "",
        priority: "medium",
      })
    } catch (error) {
      toast({
        title: "Failed to create follow-up",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const status = getVisitStatus(visit)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{visit.client?.name || "Unknown Client"}</h2>
            <Badge className={getStatusColor(status)}>{status}</Badge>
          </div>
          <p className="text-muted-foreground">Visit details and information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visit Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{new Date(visit.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start Time:</span>
              <span className="font-medium">{new Date(visit.startTime).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Time:</span>
              <span className="font-medium">{new Date(visit.endTime).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {calculateDuration(visit.startTime, visit.endTime)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Company:</span>
              <span className="font-medium">{visit.client?.name || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contacts:</span>
              <span className="font-medium">{visit.contacts?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Equipment:</span>
              <span className="font-medium">{visit.requestedEquipment?.length || 0} items</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {visit.contacts && visit.contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visit.contacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{contact.name || "Unknown Contact"}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {visit.requestedEquipment && visit.requestedEquipment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requested Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {visit.requestedEquipment.map((item, index) => (
                <Badge key={index} variant="outline">
                  {typeof item === "string" ? item : item.name || "Equipment"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {visit.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Visit Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{visit.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Sales Follow-Up Section - Only for sales visits */}
      {isSalesVisit && (
        <Card className="border-2 border-[#008cf7]/30 bg-gradient-to-r from-[#008cf7]/5 to-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#008cf7]">
              <TrendingUp className="h-5 w-5" />
              Sales Follow-Up
            </CardTitle>
            <CardDescription>Track deal progress and outcomes for this sales visit</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="space-y-4">
              <TabsList>
                <TabsTrigger value="create">Create Follow-Up</TabsTrigger>
                <TabsTrigger value="history">Follow-Up History</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                {!showSalesFollowUp ? (
                  <div className="text-center py-8">
                    <Button 
                      onClick={() => setShowSalesFollowUp(true)} 
                      className="bg-[#008cf7] hover:bg-[#006bb8]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Record Sales Follow-Up
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Track deal status: Sealed, In Progress, or Failed
                    </p>
                  </div>
                ) : (
                  <div>
                    <CreateFollowUpForm
                      visitId={visitId}
                      visitDetails={{
                        client: {
                          name: visit.client?.name || "Unknown Client",
                          location: (visit.client as any)?.location || "Unknown Location"
                        },
                        date: visit.date,
                      }}
                      onSuccess={() => {
                        setShowSalesFollowUp(false)
                        toast({
                          title: "Success!",
                          description: "Sales follow-up recorded successfully",
                        })
                      }}
                      onCancel={() => setShowSalesFollowUp(false)}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                <FollowUpList visitId={visitId} showVisitDetails={false} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Follow-up Actions
          </CardTitle>
          <CardDescription>Schedule follow-up tasks for this visit</CardDescription>
        </CardHeader>
        <CardContent>
          {!showFollowUpForm ? (
            <Button onClick={() => setShowFollowUpForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Follow-up
            </Button>
          ) : (
            <form onSubmit={handleFollowUpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="action">Follow-up Action</Label>
                <Input
                  id="action"
                  placeholder="Call client, send proposal, schedule demo..."
                  value={followUp.action}
                  onChange={(e) => setFollowUp({ ...followUp, action: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    placeholder="Employee ID or name"
                    value={followUp.assignedTo}
                    onChange={(e) => setFollowUp({ ...followUp, assignedTo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={followUp.dueDate}
                    onChange={(e) => setFollowUp({ ...followUp, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={followUp.priority}
                  onValueChange={(value: "low" | "medium" | "high") => setFollowUp({ ...followUp, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Follow-up</Button>
                <Button type="button" variant="outline" onClick={() => setShowFollowUpForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
