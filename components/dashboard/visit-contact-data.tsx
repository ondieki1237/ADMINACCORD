"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Building2, Stethoscope, ChevronRight, Mail, Phone, MapPin, Calendar, Clock, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";

export function VisitContactData({ onClose }: { onClose: () => void }) {
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

    // Fetch recent visits to select from
    const { data: recentVisits = [] } = useQuery({
        queryKey: ["visits-recent-select"],
        queryFn: async () => {
            const json = await apiService.getVisits(1, 20); // Get latest 20
            return (json.data?.docs || json.docs || []) as any[];
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
                <h2 className="text-xl font-bold text-slate-900">Contact Visit Data</h2>
            </div>

            {!selectedVisitId ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Select a Visit</CardTitle>
                        <CardDescription>Choose a recent visit to view mapped contact details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {recentVisits.map((visit) => (
                                <div
                                    key={visit._id || visit.id}
                                    onClick={() => setSelectedVisitId(visit._id || visit.id)}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{visit.client?.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {format(parseISO(visit.startTime), "MMM dd, HH:mm")} • by {visit.user?.firstName}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <VisitDetailsView visitId={selectedVisitId} onBack={() => setSelectedVisitId(null)} />
            )}
        </div>
    );
}

function VisitDetailsView({ visitId, onBack }: { visitId: string, onBack: () => void }) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["visit-contact-mapped", visitId],
        queryFn: async () => apiService.getVisitContactsMapped(visitId)
    });

    if (isLoading) return <div className="p-8 text-center">Loading detailed data...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error loading data.</div>;

    const visitData = data?.data;
    if (!visitData) return <div className="p-8 text-center">No details found.</div>;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Button variant="outline" size="sm" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Select Different Visit
            </Button>

            {/* Header Info */}
            <Card className="border-l-4 border-l-[#0089f4]">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                {visitData.client?.name}
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                                    {visitData.client?.type}
                                </Badge>
                            </h1>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {visitData.client?.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> {format(parseISO(visitData.date), "PPP")}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" /> {visitData.duration} min
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Visit Ref</p>
                            <p className="font-mono font-medium text-slate-900">{visitData.visitRef}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contacts Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Contacts Met
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {visitData.contacts?.map((contact: any, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <Avatar className="w-10 h-10 border bg-white">
                                    <AvatarFallback>{contact.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{contact.name}</h4>
                                            <p className="text-sm text-slate-600">{contact.role} • {contact.department}</p>
                                        </div>
                                        {contact.priority === 'high' && (
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200">High Priority</Badge>
                                        )}
                                    </div>

                                    <div className="mt-3 flex gap-3 text-xs text-slate-500">
                                        {contact.email && (
                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</span>
                                        )}
                                        {contact.phone && (
                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>
                                        )}
                                    </div>

                                    {contact.notes && (
                                        <div className="mt-2 p-2 bg-white rounded border border-slate-100 text-sm text-slate-700 italic">
                                            "{contact.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(!visitData.contacts || visitData.contacts.length === 0) && (
                            <p className="text-slate-500 italic">No specific contacts recorded.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Products / Machines Interest Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-emerald-600" />
                            Products of Interest
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {visitData.productsOfInterest?.map((item: any, i: number) => (
                            <div key={i} className="p-4 border border-slate-200 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-slate-900">{item.product?.name}</h4>
                                    {item.matchedMachine && (
                                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                                            Inventory Match
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{item.product?.notes}</p>

                                {item.matchedMachine && (
                                    <div className="mt-3 p-3 bg-emerald-50 rounded text-sm border border-emerald-100">
                                        <p className="font-medium text-emerald-800">Matched Equipment:</p>
                                        <p className="text-emerald-700">
                                            {item.matchedMachine.name} ({item.matchedMachine.serialNumber})
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                        {(!visitData.productsOfInterest || visitData.productsOfInterest.length === 0) && (
                            <p className="text-slate-500 italic">No product interests recorded.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {visitData.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">General Visit Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-700 whitespace-pre-line">{visitData.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
