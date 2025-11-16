"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, UserPlus, Phone, Mail, MapPin, RefreshCw, Trash2, UserCog, CheckCircle, XCircle, AlertCircle, Clock, MessageSquare, TrendingUp } from "lucide-react"

export default function LeadsList() {
  const [page, setPage] = useState(1)
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [assignInput, setAssignInput] = useState("")
  const [statusChangeNote, setStatusChangeNote] = useState("")
  const { toast } = useToast()
  const qc = useQueryClient()

  const currentUser = authService.getCurrentUserSync()
  const isAdmin = hasAdminAccess(currentUser)

  console.log("👤 User role check:", { 
    user: currentUser?.email, 
    role: currentUser?.role, 
    isAdmin,
    willUseAdminEndpoint: isAdmin 
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leads", page, isAdmin], // Include isAdmin in query key
    queryFn: async () => {
      console.log("🔍 Fetching leads from API...")
      console.log(`📍 Using ${isAdmin ? 'ADMIN' : 'USER'} endpoint`)
      console.log("📍 API URL:", `${window.location.origin}/api/${isAdmin ? 'admin/' : ''}leads?page=${page}&limit=20`)
      try {
        const result = await apiService.getLeads(page, 20, {}, isAdmin)
        console.log("✅ Leads API raw response:", result)
        console.log("📊 Response structure:", {
          hasData: !!result?.data,
          hasDocs: !!result?.data?.docs,
          isArray: Array.isArray(result),
          dataType: typeof result?.data,
          docsLength: result?.data?.docs?.length,
          pagination: result?.data?.pagination,
          fullStructure: JSON.stringify(result, null, 2)
        })
        
        if (result?.data?.docs?.length === 0) {
          console.warn("⚠️ API returned empty docs array. This could mean:")
          console.warn("  1. No leads exist in the database")
          console.warn("  2. Leads exist but query filters exclude them")
          console.warn("  3. Leads belong to different user/organization")
          console.warn("  📄 Check backend logs and database directly")
        }
        
        return result
      } catch (err: any) {
        console.error("❌ Leads fetch error:", err)
        console.error("Error details:", {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        })
        throw err
      }
    },
    staleTime: 0, // Don't use stale data
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 1,
  })

  // Fetch lead history (admin only)
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["lead-history", selectedLead?.id || selectedLead?._id],
    queryFn: async () => {
      const leadId = selectedLead?.id || selectedLead?._id;
      if (!leadId || !isAdmin) return null;
      console.log("📜 Fetching lead history for:", leadId);
      try {
        const result = await apiService.getLeadHistory(leadId);
        console.log("✅ History response:", result);
        console.log("📊 History data structure:", {
          hasStatusHistory: !!result?.statusHistory,
          historyLength: result?.statusHistory?.length,
          firstItem: result?.statusHistory?.[0],
          fullHistory: JSON.stringify(result, null, 2)
        });
        
        // Also check if lead object has statusHistory
        if (selectedLead?.statusHistory) {
          console.log("📝 Lead object also has statusHistory:", {
            length: selectedLead.statusHistory.length,
            data: selectedLead.statusHistory
          });
        }
        
        return result;
      } catch (err: any) {
        console.error("❌ History fetch error:", err);
        console.error("Error details:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        
        // Fallback to lead's own statusHistory if API fails
        if (selectedLead?.statusHistory) {
          console.log("⚠️ Using statusHistory from lead object as fallback");
          return { statusHistory: selectedLead.statusHistory };
        }
        
        return null;
      }
    },
    enabled: isHistoryDialogOpen && isAdmin && !!(selectedLead?.id || selectedLead?._id),
    staleTime: 0,
  })

  // Parse leads from various possible response structures
  const parseLeads = () => {
    if (!data) {
      console.log("⚠️ No data returned from API");
      return [];
    }

    // Try different possible structures
    let leadsArray = [];
    
    if (data.success && data.data?.docs) {
      // Structure: { success: true, data: { docs: [...] } }
      leadsArray = data.data.docs;
      console.log("📦 Parsed from data.data.docs:", leadsArray.length);
    } else if (data.success && data.data) {
      // Structure: { success: true, data: [...] }
      leadsArray = Array.isArray(data.data) ? data.data : [data.data];
      console.log("📦 Parsed from data.data:", leadsArray.length);
    } else if (data.data?.docs) {
      // Structure: { data: { docs: [...] } }
      leadsArray = data.data.docs;
      console.log("📦 Parsed from data.docs:", leadsArray.length);
    } else if (data.data) {
      // Structure: { data: [...] }
      leadsArray = Array.isArray(data.data) ? data.data : [data.data];
      console.log("📦 Parsed from data:", leadsArray.length);
    } else if (Array.isArray(data)) {
      // Structure: [...]
      leadsArray = data;
      console.log("📦 Parsed from array:", leadsArray.length);
    } else {
      console.log("⚠️ Unknown data structure:", data);
    }

    return Array.isArray(leadsArray) ? leadsArray : [];
  };

  const leads = parseLeads()
  const hasLeads = leads.length > 0

  useEffect(() => {
    console.log("🔄 Leads data state updated:", { 
      data, 
      isLoading, 
      error,
      parsedLeads: leads,
      leadsCount: leads.length,
      hasLeads
    })
  }, [data, isLoading, error, leads, hasLeads])

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      apiService.updateLead(id, payload, isAdmin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] })
      toast({ title: "Lead updated successfully" })
      setIsDialogOpen(false)
    },
    onError: (err: any) => {
      console.error("Update lead error:", err)
      toast({ title: "Failed to update lead", description: err.message, variant: "destructive" })
    },
  })

  const deleteLeadMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteLead(id, isAdmin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] })
      toast({ title: "Lead deleted successfully" })
      setIsDialogOpen(false)
    },
    onError: (err: any) => {
      console.error("Delete lead error:", err)
      toast({ title: "Failed to delete lead", description: err.message, variant: "destructive" })
    },
  })

  const openLead = (lead: any) => {
    setSelectedLead(lead)
    setAssignInput("")
    setStatusChangeNote("")
    setIsDialogOpen(true)
  }

  const handleStatusChange = (status: string) => {
    if (!selectedLead) return
    const payload: any = { leadStatus: status }
    
    // Include statusChangeNote if provided
    if (statusChangeNote.trim()) {
      payload.statusChangeNote = statusChangeNote.trim()
    }
    
    updateLeadMutation.mutate({ 
      id: selectedLead.id || selectedLead._id, 
      payload 
    })
    
    // Clear note after submission
    setStatusChangeNote("")
  }

  const handleAssign = () => {
    if (!selectedLead || !assignInput.trim()) return
    updateLeadMutation.mutate({ id: selectedLead.id || selectedLead._id, payload: { assignedTo: assignInput.trim() } })
  }

  const handleDelete = () => {
    if (!selectedLead) return
    if (confirm("Are you sure you want to delete this lead?")) {
      const id = selectedLead.id || selectedLead._id
      deleteLeadMutation.mutate(id)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "contacted": return "bg-blue-100 text-blue-800 border-blue-200"
      case "qualified": return "bg-purple-100 text-purple-800 border-purple-200"
      case "proposal-sent": return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "won": return "bg-green-100 text-green-800 border-green-200"
      case "lost": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-[#008cf7] hover:bg-[#008cf7]/10"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#0066cc] shadow-lg flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
                  <p className="text-sm text-gray-600">
                    Track and manage sales leads
                    {isAdmin && <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">👑 Admin View - All Leads</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={async () => {
                  const endpoint = isAdmin ? '/admin/leads' : '/leads';
                  console.log(`🧪 Testing ${isAdmin ? 'ADMIN' : 'USER'} API endpoint directly...`);
                  const token = authService.getAccessToken();
                  console.log("Token exists:", !!token);
                  console.log("Testing URL:", `https://app.codewithseth.co.ke/api${endpoint}?page=1&limit=20`);
                  try {
                    const response = await fetch(`https://app.codewithseth.co.ke/api${endpoint}?page=1&limit=20`, {
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                      }
                    });
                    console.log("Direct fetch response:", {
                      status: response.status,
                      ok: response.ok,
                      statusText: response.statusText
                    });
                    const data = await response.json();
                    console.log("Direct fetch data:", data);
                    alert(`API Test (${isAdmin ? 'ADMIN' : 'USER'} endpoint): ${response.ok ? 'Success' : 'Failed'}\nStatus: ${response.status}\nLeads: ${data?.data?.docs?.length || 0}\nCheck console for details`);
                  } catch (err: any) {
                    console.error("Direct fetch error:", err);
                    alert(`API Test Failed: ${err.message}`);
                  }
                }}
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700"
              >
                🧪 Test API
              </Button>
              <Button 
                onClick={async () => {
                  console.log("🔄 Force refreshing leads (clearing cache)...")
                  await qc.invalidateQueries({ queryKey: ["leads"] })
                  await refetch()
                  console.log("✅ Cache cleared and data refetched")
                }} 
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Force Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{leads.length || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-[#008cf7]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">New Leads</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {leads.filter((l: any) => l.leadStatus === 'new').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {leads.length > 0 
                      ? Math.round((leads.filter((l: any) => l.leadStatus === 'won').length / leads.length) * 100) 
                      : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <Card className="bg-white border border-gray-200/60">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">All Leads</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {hasLeads ? `${leads.length} lead${leads.length !== 1 ? 's' : ''} found` : 'No leads available'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="animate-pulse grid gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold mb-2">Failed to load leads</p>
                <p className="text-sm text-gray-600 mb-4">{(error as any)?.message || 'Unknown error'}</p>
                <Button onClick={() => qc.invalidateQueries({ queryKey: ["leads"] })} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : !hasLeads ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold mb-2">No leads found</p>
                <p className="text-sm text-gray-600 mb-4">
                  The API returned an empty list. If you have leads in the database, try clicking <strong>"Force Refresh"</strong> above to clear the cache.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={async () => {
                      console.log("🔄 Force refreshing from empty state...")
                      await qc.invalidateQueries({ queryKey: ["leads"] })
                      await refetch()
                    }}
                    variant="default"
                    className="bg-[#008cf7] hover:bg-[#0070c9]"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache & Reload
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((lead: any) => (
                  <div 
                    key={lead.id || lead._id} 
                    className="flex items-center justify-between p-5 rounded-xl border border-gray-200 hover:border-[#008cf7]/50 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-gray-900 text-lg">
                          {lead.name || lead.facilityName || 'Unnamed lead'}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(lead.leadStatus || 'new')}`}>
                          {lead.leadStatus || 'new'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {lead.contactPerson?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {lead.contactPerson.phone}
                          </span>
                        )}
                        {lead.contactPerson?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {lead.contactPerson.email}
                          </span>
                        )}
                        {lead.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {lead.location}
                          </span>
                        )}
                        {lead.createdBy && isAdmin && (
                          <span className="flex items-center gap-1 text-purple-600">
                            <UserCog className="h-3.5 w-3.5" />
                            Created by: {lead.createdBy.name || lead.createdBy.email || 'Unknown'}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => openLead(lead)}
                      className="bg-[#008cf7] hover:bg-[#0066cc] text-white"
                    >
                      Track Lead
                    </Button>
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedLead(lead)
                          setIsHistoryDialogOpen(true)
                        }}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        History
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Track Lead Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#008cf7]" />
                Track Lead
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Lead Info */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Facility/Lead Name</p>
                  <p className="font-semibold text-gray-900">{selectedLead?.name || selectedLead?.facilityName}</p>
                </div>
                {selectedLead?.contactPerson && (
                  <div>
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="text-gray-900">{selectedLead.contactPerson.name}</p>
                    {selectedLead.contactPerson.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {selectedLead.contactPerson.phone}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusBadgeColor(selectedLead?.leadStatus || 'new')}`}>
                    {selectedLead?.leadStatus || 'new'}
                  </span>
                </div>
                {selectedLead?.createdBy && isAdmin && (
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="text-gray-900 flex items-center gap-2 mt-1">
                      <UserCog className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">{selectedLead.createdBy.name || selectedLead.createdBy.email}</span>
                    </p>
                    {selectedLead.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedLead.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status Update Actions */}
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-3 block">Update Status</Label>
                
                {/* Status Change Note Input */}
                <div className="mb-3">
                  <Label className="text-xs text-gray-600 mb-1 block">
                    Add note about this status change (optional)
                  </Label>
                  <Input 
                    placeholder="e.g., Budget confirmed, Follow-up scheduled..." 
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('contacted')}
                    className="border-blue-300 hover:bg-blue-50"
                  >
                    Contacted
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('qualified')}
                    className="border-purple-300 hover:bg-purple-50"
                  >
                    Qualified
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('proposal-sent')}
                    className="border-indigo-300 hover:bg-indigo-50"
                  >
                    Proposal Sent
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('negotiation')}
                    className="border-yellow-300 hover:bg-yellow-50"
                  >
                    Negotiation
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('won')}
                    className="border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Won
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('lost')}
                    className="border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Lost
                  </Button>
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="pt-4 border-t border-gray-200">
                  <Label className="text-sm font-medium text-gray-900 mb-3 block flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-[#008cf7]" />
                    Admin Actions
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Assign to (user ID or email)" 
                        className="flex-1" 
                        value={assignInput}
                        onChange={(e) => setAssignInput(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        onClick={handleAssign}
                        disabled={!assignInput.trim()}
                        className="bg-[#008cf7] hover:bg-[#0066cc]"
                      >
                        Assign
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={handleDelete}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Lead
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false)
                    setIsHistoryDialogOpen(true)
                  }}
                  className="mr-auto border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  View History
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lead History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Lead History & Activity
              </DialogTitle>
              <CardDescription>
                Track all changes, status updates, and comments for this lead
              </CardDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Lead Info Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {selectedLead?.name || selectedLead?.facilityName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedLead?.contactPerson?.name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(selectedLead?.leadStatus || 'new')}`}>
                    {selectedLead?.leadStatus || 'new'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                  <span>Created: {selectedLead?.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : 'N/A'}</span>
                  <span>•</span>
                  <span>Updated: {selectedLead?.updatedAt ? new Date(selectedLead.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#008cf7]" />
                    Activity Timeline
                    {historyData?.statusHistory && (
                      <span className="text-xs text-gray-500 font-normal">
                        ({historyData.statusHistory.length} event{historyData.statusHistory.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => refetchHistory()}
                    className="h-8 px-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#008cf7]" />
                    <span className="ml-2 text-gray-600">Loading history...</span>
                  </div>
                ) : historyData?.statusHistory && historyData.statusHistory.length > 0 ? (
                  <div className="space-y-3">
                    {[...historyData.statusHistory].reverse().map((item: any, index: number) => (
                      <div key={index} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                        {/* Timeline dot */}
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#008cf7]" />
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          {/* Action Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${
                                item.to === 'won' ? 'bg-green-100' :
                                item.to === 'lost' ? 'bg-red-100' :
                                item.to === 'contacted' ? 'bg-blue-100' :
                                item.to === 'qualified' ? 'bg-purple-100' :
                                'bg-yellow-100'
                              }`}>
                                {item.to === 'won' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                                 item.to === 'lost' ? <XCircle className="h-4 w-4 text-red-600" /> :
                                 <AlertCircle className="h-4 w-4 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  Status Changed
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.changedAt ? new Date(item.changedAt).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Details */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(item.from || 'new')}`}>
                                {item.from || 'new'}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(item.to)}`}>
                                {item.to}
                              </span>
                            </div>

                            {item.note && (
                              <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-blue-600 font-medium mb-1">📝 Note:</p>
                                <p className="text-sm text-gray-700">"{item.note}"</p>
                              </div>
                            )}

                            {/* User info - Enhanced display */}
                            {item.changedBy && (
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                    <UserCog className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">
                                      {item.changedBy.name || 'Unknown User'}
                                    </p>
                                    {item.changedBy.email && (
                                      <p className="text-gray-500 text-[10px]">
                                        {item.changedBy.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No history available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {historyData ? 'No status changes recorded yet' : 'Failed to load history or endpoint not available'}
                    </p>
                    {historyData && (
                      <details className="mt-4 text-left">
                        <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                          Show raw response
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(historyData, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Additional Lead Details */}
                {(selectedLead?.notes || selectedLead?.comments) && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      Latest Notes/Comments
                    </h5>
                    <p className="text-sm text-gray-700">
                      {selectedLead.notes || selectedLead.comments || 'No notes available'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
