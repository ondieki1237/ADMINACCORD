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
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  Package,
  DollarSign,
  Grid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface Consumable {
  _id: string
  id?: string
  category: string
  name: string
  price: number
  unit: string
  description?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface ConsumablesResponse {
  data: {
    docs: Consumable[]
    pagination: {
      total: number
      pages: number
      currentPage: number
    }
  }
}

export default function ConsumablesList() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState("")
  const { toast } = useToast()
  const qc = useQueryClient()

  const currentUser = authService.getCurrentUserSync()
  const isAdmin = hasAdminAccess(currentUser)

  // Form state for both create and edit
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    price: "",
    unit: "",
    description: "",
  })

  // Fetch consumables
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["consumables", page, searchQuery, filterCategory],
    queryFn: async () => {
      console.log("🔍 Fetching consumables...")
      try {
        const filters: Record<string, any> = {}
        if (searchQuery) filters.search = searchQuery
        if (filterCategory) filters.category = filterCategory

        const result = await apiService.getConsumables(page, 20, filters)
        console.log("✅ Consumables response:", result)
        return result as ConsumablesResponse
      } catch (err: any) {
        console.error("❌ Consumables fetch error:", err)
        throw err
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    retry: 1,
  })

  // Create consumable mutation
  const createMutation = useMutation({
    mutationFn: (newData: any) => apiService.createConsumable(newData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Consumable created successfully",
        variant: "default",
      })
      qc.invalidateQueries({ queryKey: ["consumables"] })
      setIsCreateDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create consumable",
        variant: "destructive",
      })
    },
  })

  // Update consumable mutation
  const updateMutation = useMutation({
    mutationFn: (updateData: any) => {
      const consumableId = selectedConsumable?._id || selectedConsumable?.id
      if (!consumableId) throw new Error("Consumable ID is required")
      return apiService.updateConsumable(consumableId, updateData)
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Consumable updated successfully",
        variant: "default",
      })
      qc.invalidateQueries({ queryKey: ["consumables"] })
      setIsDialogOpen(false)
      setSelectedConsumable(null)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update consumable",
        variant: "destructive",
      })
    },
  })

  // Delete consumable mutation
  const deleteMutation = useMutation({
    mutationFn: (consumableId: string) => apiService.deleteConsumable(consumableId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Consumable deleted successfully",
        variant: "default",
      })
      qc.invalidateQueries({ queryKey: ["consumables"] })
      setSelectedConsumable(null)
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete consumable",
        variant: "destructive",
      })
    },
  })

  const resetForm = () => {
    setFormData({
      category: "",
      name: "",
      price: "",
      unit: "",
      description: "",
    })
  }

  const handleEdit = (consumable: Consumable) => {
    setSelectedConsumable(consumable)
    setFormData({
      category: consumable.category,
      name: consumable.name,
      price: consumable.price.toString(),
      unit: consumable.unit,
      description: consumable.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleCreateClick = () => {
    resetForm()
    setSelectedConsumable(null)
    setIsCreateDialogOpen(true)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.category || !formData.name || !formData.price || !formData.unit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const submitData = {
      category: formData.category,
      name: formData.name,
      price: parseFloat(formData.price),
      unit: formData.unit,
      ...(formData.description && { description: formData.description }),
    }

    if (selectedConsumable) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleDelete = async (consumableId: string) => {
    if (window.confirm("Are you sure you want to delete this consumable?")) {
      deleteMutation.mutate(consumableId)
    }
  }

  const consumables = data?.data?.docs || []
  const pagination = data?.data?.pagination || { total: 0, pages: 0, currentPage: 1 }
  const categories = Array.from(
    new Set(consumables.map((c) => c.category))
  ) as string[]

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold">Access Denied</p>
              <p className="text-muted-foreground">Only admins can access consumables management</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Consumables Management</h1>
              <p className="text-muted-foreground">Manage medical consumables and supplies</p>
            </div>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Consumable
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-sm text-muted-foreground">Total Consumables</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Grid className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  KES {(consumables.reduce((sum, c) => sum + c.price, 0)).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Search by Name</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search consumables..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value)
                    setPage(1)
                  }}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="w-full flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consumables Table */}
        <Card>
          <CardHeader>
            <CardTitle>Consumables List</CardTitle>
            <CardDescription>
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of{" "}
              {pagination.total} consumables
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading consumables...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-500">Error loading consumables</p>
                  <p className="text-sm text-muted-foreground">{String(error)}</p>
                </div>
              </div>
            ) : consumables.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No consumables found</p>
                  <Button
                    onClick={handleCreateClick}
                    variant="outline"
                    className="mt-4 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Consumable
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Unit</th>
                        <th className="text-right py-3 px-4 font-semibold text-foreground">Price</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumables.map((consumable) => (
                        <tr
                          key={consumable._id || consumable.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-foreground">{consumable.name}</p>
                              {consumable.description && (
                                <p className="text-sm text-muted-foreground">{consumable.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                              {consumable.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground">{consumable.unit}</td>
                          <td className="py-3 px-4 text-right">
                            <p className="font-semibold text-foreground">
                              KES {consumable.price.toLocaleString()}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {consumable.isActive ? (
                              <div className="flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600">Active</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Inactive</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(consumable)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const id = consumable._id || consumable.id
                                  if (id) handleDelete(id)
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.pages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum =
                        pagination.pages <= 5 ? i + 1 : Math.max(1, page - 2) + i
                      if (pageNum > pagination.pages) return null
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                      disabled={page === pagination.pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsDialogOpen(false)
          setSelectedConsumable(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedConsumable ? "Edit Consumable" : "Create New Consumable"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">Select Category</option>
                <option value="Thyroid Function">Thyroid Function</option>
                <option value="Cardiac Markers">Cardiac Markers</option>
                <option value="Blood Tests">Blood Tests</option>
                <option value="Imaging">Imaging</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., FT4"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (KES) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 8000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <select
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">Select Unit</option>
                <option value="kit">Kit</option>
                <option value="box">Box</option>
                <option value="bottle">Bottle</option>
                <option value="vial">Vial</option>
                <option value="cartridge">Cartridge</option>
                <option value="pack">Pack</option>
                <option value="unit">Unit</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsDialogOpen(false)
                setSelectedConsumable(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
