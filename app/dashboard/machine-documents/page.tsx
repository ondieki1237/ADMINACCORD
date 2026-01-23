"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    FileText,
    Upload,
    Trash2,
    Search,
    File,
    Download,
    AlertCircle,
    Loader2,
    ExternalLink,
    Plus
} from "lucide-react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface MachineDocument {
    _id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    driveFileId: string;
    webViewLink: string;
    machineId?: string;
    notes?: string;
    uploadedBy: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

export default function MachineDocumentsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [machineId, setMachineId] = useState("");
    const [notes, setNotes] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading, error } = useQuery<MachineDocument[]>({
        queryKey: ["machine-documents"],
        queryFn: async () => {
            const response = await apiService.getMachineDocuments();
            return response.data || [];
        }
    });

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return apiService.uploadMachineDocument(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["machine-documents"] });
            toast({
                title: "Success",
                description: "Document uploaded successfully",
            });
            setIsUploadOpen(false);
            resetUploadForm();
        },
        onError: (err: any) => {
            toast({
                title: "Upload failed",
                description: err.message || "An error occurred during upload",
                variant: "destructive",
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiService.deleteMachineDocument(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["machine-documents"] });
            toast({
                title: "Deleted",
                description: "Document removed successfully",
            });
        },
        onError: (err: any) => {
            toast({
                title: "Delete failed",
                description: err.message || "An error occurred during deletion",
                variant: "destructive",
            });
        }
    });

    const resetUploadForm = () => {
        setUploadFile(null);
        setMachineId("");
        setNotes("");
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append("file", uploadFile);
        if (machineId) formData.append("machineId", machineId);
        if (notes) formData.append("notes", notes);

        uploadMutation.mutate(formData);
    };

    const filteredDocuments = documents.filter(doc =>
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.notes?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-[#008cf7]" />
                        Machine Documentations
                    </h1>
                    <p className="text-gray-500">Manage and access machine manuals and documentation</p>
                </div>

                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#0089f4] hover:bg-blue-600 shadow-md">
                            <Plus className="h-4 w-4 mr-2" />
                            Upload Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleUpload}>
                            <DialogHeader>
                                <DialogTitle>Upload Machine Document</DialogTitle>
                                <DialogDescription>
                                    Upload a manual or documentation file. Supported up to 50MB.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="file">File</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="machineId">Machine ID (Optional)</Label>
                                    <Input
                                        id="machineId"
                                        placeholder="Enter machine ID if applicable"
                                        value={machineId}
                                        onChange={(e) => setMachineId(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Input
                                        id="notes"
                                        placeholder="Add brief notes about this file"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    className="bg-[#0089f4] hover:bg-blue-600 w-full"
                                    disabled={uploadMutation.isPending || !uploadFile}
                                >
                                    {uploadMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload to Drive
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-gray-100 mb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">All Documents</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search documents..."
                                className="pl-10 h-10 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-10 w-10 text-[#008cf7] animate-spin" />
                            <p className="text-gray-500 font-medium tracking-wide">Fetching documents from Drive...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                            <div className="p-4 bg-red-50 rounded-full">
                                <AlertCircle className="h-10 w-10 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Connection Error</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">Failed to load documents from the server. Please check your connection.</p>
                            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["machine-documents"] })} variant="outline" className="mt-2">
                                Try Again
                            </Button>
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 border-2 border-dashed border-gray-100 rounded-2xl">
                            <div className="p-4 bg-gray-50 rounded-full">
                                <File className="h-10 w-10 text-gray-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">No documents found</h3>
                                <p className="text-gray-500 max-w-xs mx-auto text-sm">
                                    {searchQuery ? "No documents match your search criteria." : "Start by uploading machine manuals and project documentations."}
                                </p>
                            </div>
                            <Button
                                onClick={() => setIsUploadOpen(true)}
                                variant="outline"
                                className="border-dashed border-gray-300 text-gray-600"
                            >
                                Upload your first file
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDocuments.map((doc) => (
                                <Card key={doc._id} className="overflow-hidden border border-gray-100 hover:border-[#008cf7]/50 hover:shadow-md transition-all duration-200 group bg-white">
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="bg-blue-50 p-2.5 rounded-xl group-hover:bg-blue-100 transition-colors">
                                                <File className="h-5 w-5 text-[#0089f4]" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-[#0089f4] hover:bg-blue-50"
                                                    title="View on Google Drive"
                                                    asChild
                                                >
                                                    <a href={doc.webViewLink} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                    title="Delete document"
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to delete this document?")) {
                                                            deleteMutation.mutate(doc._id);
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-gray-900 truncate" title={doc.fileName}>
                                                {doc.fileName}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px] font-medium font-mono uppercase">
                                                    {doc.mimeType.split('/').pop()}
                                                </Badge>
                                                <span className="text-[11px] text-gray-400">{formatFileSize(doc.fileSize)}</span>
                                            </div>
                                        </div>

                                        {doc.notes && (
                                            <p className="text-sm text-gray-600 line-clamp-2 bg-gray-50/50 p-2 rounded-lg italic">
                                                "{doc.notes}"
                                            </p>
                                        )}

                                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center text-white text-[10px] font-bold">
                                                    {doc.uploadedBy.firstName?.[0]}{doc.uploadedBy.lastName?.[0]}
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {doc.uploadedBy.firstName}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Download className="h-3 w-3" />
                                                {format(new Date(doc.createdAt), "MMM dd, yyyy")}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
