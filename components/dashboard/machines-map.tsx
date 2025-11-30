"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { apiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    MapPin,
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    Activity,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
} from "lucide-react"
import "leaflet/dist/leaflet.css"
import "@/styles/map.css"

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

// Kenya center coordinates
const KENYA_CENTER: [number, number] = [0.0236, 37.9062]
const KENYA_ZOOM = 6

interface MachinesMapProps { }

// Component to handle map centering
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap()

    useEffect(() => {
        map.setView(center, zoom)
    }, [center, zoom, map])

    return null
}

export function MachinesMap({ }: MachinesMapProps) {
    const [filters, setFilters] = useState<{
        model?: string
        manufacturer?: string
        status?: string
    }>({})
    const [statsCollapsed, setStatsCollapsed] = useState(false)
    const [legendCollapsed, setLegendCollapsed] = useState(false)

    // Fetch map data
    const {
        data: mapData,
        isLoading: mapLoading,
        error: mapError,
        refetch: refetchMap,
    } = useQuery({
        queryKey: ["machines-map", filters],
        queryFn: async () => {
            const response = await apiService.getMachinesMap(filters)
            return response.data
        },
    })

    // Fetch stats for filter options
    const { data: statsData } = useQuery({
        queryKey: ["machines-map-stats"],
        queryFn: async () => {
            const response = await apiService.getMachinesMapStats()
            return response.data
        },
    })

    // Create custom colored markers
    const createColoredIcon = (color: string) => {
        return L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12],
        })
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value === "all" ? undefined : value,
        }))
    }

    const clearFilters = () => {
        setFilters({})
    }

    const hasActiveFilters = Object.values(filters).some((v) => v !== undefined)

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <CheckCircle2 className="h-4 w-4 text-green-600" />
            case "inactive":
                return <XCircle className="h-4 w-4 text-gray-600" />
            case "maintenance":
                return <AlertCircle className="h-4 w-4 text-amber-600" />
            case "decommissioned":
                return <XCircle className="h-4 w-4 text-red-600" />
            default:
                return <Activity className="h-4 w-4 text-blue-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "text-green-600 bg-green-50"
            case "inactive":
                return "text-gray-600 bg-gray-50"
            case "maintenance":
                return "text-amber-600 bg-amber-50"
            case "decommissioned":
                return "text-red-600 bg-red-50"
            default:
                return "text-blue-600 bg-blue-50"
        }
    }

    if (mapError) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-4">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Failed to Load Map Data
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {(mapError as Error).message || "An error occurred while loading the map"}
                    </p>
                    <Button onClick={() => refetchMap()} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    if (mapLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-4">
                <Loader2 className="h-12 w-12 text-[#008cf7] animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading machines map...</p>
            </div>
        )
    }

    const machines = mapData?.machines || []
    const legend = mapData?.legend || []
    const stats = mapData?.stats || {}

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Machines Spread
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Geographic distribution of installed machines across Kenya
                    </p>
                </div>
                <Button onClick={() => refetchMap()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Map Container */}
            <div className="relative machines-map-container">
                <MapContainer
                    center={KENYA_CENTER}
                    zoom={KENYA_ZOOM}
                    style={{ height: "100%", width: "100%", borderRadius: "12px" }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController center={KENYA_CENTER} zoom={KENYA_ZOOM} />

                    {/* Render markers */}
                    {machines.map((machine: any) => (
                        <Marker
                            key={machine.id}
                            position={[machine.coordinates.lat, machine.coordinates.lng]}
                            icon={createColoredIcon(machine.color)}
                        >
                            <Popup>
                                <div className="p-4 min-w-[250px]">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900">
                                        {machine.facility.name}
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-700">Model:</span>
                                            <span className="text-gray-600">{machine.model}</span>
                                        </div>
                                        {machine.serialNumber && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-700">Serial:</span>
                                                <span className="text-gray-600">{machine.serialNumber}</span>
                                            </div>
                                        )}
                                        {machine.manufacturer && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-700">Manufacturer:</span>
                                                <span className="text-gray-600">{machine.manufacturer}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-700">Status:</span>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    machine.status
                                                )}`}
                                            >
                                                {machine.status}
                                            </span>
                                        </div>
                                        {machine.facility.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-500" />
                                                <span className="text-gray-600">{machine.facility.location}</span>
                                            </div>
                                        )}
                                        {machine.contactPerson?.name && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="font-semibold text-gray-700 mb-1">Contact Person</p>
                                                <p className="text-gray-600">{machine.contactPerson.name}</p>
                                                {machine.contactPerson.phone && (
                                                    <p className="text-gray-600 text-xs">{machine.contactPerson.phone}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Filter Controls - Top Left */}
                <div className="map-control-panel top-4 left-4">
                    <Card className="glass-panel p-4 space-y-3" style={{ minWidth: "280px" }}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-[#008cf7]" />
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
                            </div>
                            {hasActiveFilters && (
                                <Button
                                    onClick={clearFilters}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                    Model
                                </label>
                                <Select
                                    value={filters.model || "all"}
                                    onValueChange={(value) => handleFilterChange("model", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Models" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Models</SelectItem>
                                        {statsData?.models?.map((model: string) => (
                                            <SelectItem key={model} value={model}>
                                                {model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                    Manufacturer
                                </label>
                                <Select
                                    value={filters.manufacturer || "all"}
                                    onValueChange={(value) => handleFilterChange("manufacturer", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Manufacturers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Manufacturers</SelectItem>
                                        {statsData?.manufacturers?.map((manufacturer: string) => (
                                            <SelectItem key={manufacturer} value={manufacturer}>
                                                {manufacturer}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                    Status
                                </label>
                                <Select
                                    value={filters.status || "all"}
                                    onValueChange={(value) => handleFilterChange("status", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                        <SelectItem value="decommissioned">Decommissioned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Statistics Panel - Top Right */}
                <div className="map-control-panel top-4 right-4">
                    <Card className="glass-panel p-4" style={{ minWidth: "280px" }}>
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setStatsCollapsed(!statsCollapsed)}
                        >
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-[#008cf7]" />
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Statistics</h3>
                            </div>
                            {statsCollapsed ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                            )}
                        </div>

                        {!statsCollapsed && (
                            <div className="mt-4 space-y-3">
                                <div className="stat-card">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Machines</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {stats.total || 0}
                                    </p>
                                </div>

                                <div className="stat-card">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Geocoded</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        {stats.geocoded || 0}
                                        <span className="text-xs text-gray-500 ml-1">
                                            ({stats.total > 0 ? Math.round((stats.geocoded / stats.total) * 100) : 0}%)
                                        </span>
                                    </p>
                                </div>

                                <div className="stat-card">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Unique Locations</p>
                                    <p className="text-lg font-semibold text-blue-600">{stats.uniqueLocations || 0}</p>
                                </div>

                                {stats.byStatus && (
                                    <div className="stat-card">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">By Status</p>
                                        <div className="space-y-1">
                                            {Object.entries(stats.byStatus).map(([status, count]) => (
                                                <div key={status} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(status)}
                                                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                                                            {status}
                                                        </span>
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {count as number}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Legend Panel - Bottom Right */}
                <div className="map-control-panel bottom-4 right-4">
                    <Card className="glass-panel p-4" style={{ minWidth: "280px", maxHeight: "400px" }}>
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setLegendCollapsed(!legendCollapsed)}
                        >
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-[#008cf7]" />
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Legend</h3>
                            </div>
                            {legendCollapsed ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                            )}
                        </div>

                        {!legendCollapsed && (
                            <div className="mt-3 space-y-1 overflow-y-auto" style={{ maxHeight: "320px" }}>
                                {legend.map((item: any) => (
                                    <div key={item.model} className="legend-item">
                                        <div
                                            className="legend-color-dot"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {item.model}
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                                {legend.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                        No machines to display
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
