"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { authService } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/permissions";
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
    linkUrl?: string;
        // machineId and notes removed
    uploadedBy: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

export default function MachineDocumentsPage() {
    const currentUser = authService.getCurrentUserSync();
    const isAdmin = hasAdminAccess(currentUser);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isLinkMode, setIsLinkMode] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkTitle, setLinkTitle] = useState("");
    // Edit modal state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDoc, setEditDoc] = useState<any | null>(null);
    const [editLinkUrl, setEditLinkUrl] = useState("");
    const [editLinkTitle, setEditLinkTitle] = useState("");
    const [editSelectedCategory, setEditSelectedCategory] = useState("");
    const [editSelectedManufacturer, setEditSelectedManufacturer] = useState("");
    
    const [categories, setCategories] = useState<any[]>([]);
    const [manufacturers, setManufacturers] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
    const [showCreateCategory, setShowCreateCategory] = useState(false);
    const [showCreateManufacturer, setShowCreateManufacturer] = useState(false);
    const [createCategoryName, setCreateCategoryName] = useState("");
    const [createManufacturerName, setCreateManufacturerName] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading, error } = useQuery<MachineDocument[]>({
        queryKey: ["machine-documents"],
        queryFn: async () => {
            const response = await apiService.getMachineDocuments();
            return response.data || [];
        }
    });

    // fetch categories & manufacturers for selection (always from backend API base URL)
    useEffect(() => {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500/api';
        fetch(`${API_BASE}/document-categories`).then(res => res.json()).then(json => setCategories(json.data || []));
        fetch(`${API_BASE}/manufacturers`).then(res => res.json()).then(json => setManufacturers(json.data || []));
    }, []);

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

    const createLinkMutation = useMutation({
        mutationFn: async (payload: any) => apiService.createMachineDocumentLink(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["machine-documents"] });
            toast({ title: "Success", description: "Document link created" });
            setIsUploadOpen(false);
            resetUploadForm();
        },
        onError: (err: any) => {
            toast({ title: "Failed", description: err.message || "Failed to create link", variant: 'destructive' });
        }
    });

    const createCategoryMutation = useMutation({
        mutationFn: async (payload: any) => apiService.createDocumentCategory(payload),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ["document-categories"] });
            setCategories((prev) => [...prev, res.data]);
            toast({ title: 'Category created' });
        }
    });

    const createManufacturerMutation = useMutation({
        mutationFn: async (payload: any) => apiService.createManufacturer(payload),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
            setManufacturers((prev) => [...prev, res.data]);
            toast({ title: 'Manufacturer created' });
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
        setIsLinkMode(false);
        setLinkUrl("");
        setLinkTitle("");
        setSelectedCategory("");
        setSelectedManufacturer("");
    };

    const resetEditForm = () => {
        setEditDoc(null);
        setEditLinkUrl("");
        setEditLinkTitle("");
        setEditSelectedCategory("");
        setEditSelectedManufacturer("");
    };
    // Update mutation for editing machine document (link type only for now)
    const updateLinkMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            // Only support updating link documents for now
            return apiService.makeRequest(`/machine-documents/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["machine-documents"] });
            toast({ title: "Success", description: "Document updated" });
            setIsEditOpen(false);
            resetEditForm();
        },
        onError: (err: any) => {
            toast({ title: "Failed", description: err.message || "Failed to update document", variant: 'destructive' });
        }
    });
    // Open edit modal and pre-fill state
    const handleEdit = (doc: any) => {
        setEditDoc(doc);
        setEditLinkUrl(doc.linkUrl || "");
        setEditLinkTitle(doc.title || doc.fileName || "");
        setEditSelectedCategory(doc.categoryId || "");
        setEditSelectedManufacturer(doc.manufacturerId || "");
        setIsEditOpen(true);
    };
    const handleEditSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDoc) return;
        if (!editLinkTitle || !editLinkUrl) {
            toast({ title: 'Missing fields', description: 'Please provide a title and a link URL', variant: 'destructive' });
            return;
        }
        const payload: any = {
            type: 'link',
            title: editLinkTitle,
            linkUrl: editLinkUrl,
            categoryId: editSelectedCategory || undefined,
            manufacturerId: editSelectedManufacturer || undefined,
        };
        updateLinkMutation.mutate({ id: editDoc._id, payload });
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLinkMode) {
            if (!linkUrl || !linkTitle) {
                toast({ title: 'Missing fields', description: 'Please provide a title and a link URL', variant: 'destructive' });
                return;
            }
            const payload: any = {
                type: 'link',
                title: linkTitle,
                linkUrl: linkUrl,
                categoryId: selectedCategory || undefined,
                manufacturerId: selectedManufacturer || undefined,
            };
            createLinkMutation.mutate(payload);
            return;
        }

        if (!uploadFile) return;

        const formData = new FormData();
        formData.append("file", uploadFile);

        uploadMutation.mutate(formData);
    };

    const filteredDocuments = documents.filter(doc =>
        (String(doc.fileName || doc.title || '').toLowerCase()).includes(searchQuery.toLowerCase())
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

                {isAdmin && (
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                                <DialogTrigger asChild>
                                    <span>
                                        <Button className="bg-[#0089f4] hover:bg-blue-600 shadow-md">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Upload Document
                                        </Button>
                                    </span>
                                </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <form onSubmit={handleUpload}>
                                <DialogHeader>
                                    <DialogTitle>Upload Machine Document</DialogTitle>
                                    <DialogDescription>
                                        Upload a manual or create a link-based document. Admins can create categories and manufacturers.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant={isLinkMode ? 'ghost' : 'default'}
                                            onClick={() => setIsLinkMode(false)}
                                        >
                                            File
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={isLinkMode ? 'default' : 'ghost'}
                                            onClick={() => setIsLinkMode(true)}
                                        >
                                            Link / URL
                                        </Button>
                                    </div>

                                    {isLinkMode ? (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="linkTitle">Title</Label>
                                                <Input id="linkTitle" placeholder="Document title" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="linkUrl">Link URL</Label>
                                                <Input id="linkUrl" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Category</Label>
                                                <div className="flex gap-2">
                                                    <select className="flex-1" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                                        <option value="">-- Select category --</option>
                                                        {categories.map((c: any) => (
                                                            <option key={c._id} value={c._id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateCategory((v) => !v)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {showCreateCategory && (
                                                    <div className="flex gap-2">
                                                        <Input placeholder="New category name" value={createCategoryName} onChange={(e) => setCreateCategoryName(e.target.value)} />
                                                        <Button type="button" onClick={() => {
                                                            if (!createCategoryName) return toast({ title: 'Enter name', variant: 'destructive' });
                                                            createCategoryMutation.mutate({ name: createCategoryName });
                                                            setCreateCategoryName('');
                                                            setShowCreateCategory(false);
                                                        }}>Create</Button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Manufacturer</Label>
                                                <div className="flex gap-2">
                                                    <select className="flex-1" value={selectedManufacturer} onChange={(e) => setSelectedManufacturer(e.target.value)}>
                                                        <option value="">-- Select manufacturer --</option>
                                                        {manufacturers.map((m: any) => (
                                                            <option key={m._id} value={m._id}>{m.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateManufacturer((v) => !v)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {showCreateManufacturer && (
                                                    <div className="flex gap-2">
                                                        <Input placeholder="New manufacturer" value={createManufacturerName} onChange={(e) => setCreateManufacturerName(e.target.value)} />
                                                        <Button type="button" onClick={() => {
                                                            if (!createManufacturerName) return toast({ title: 'Enter name', variant: 'destructive' });
                                                            createManufacturerMutation.mutate({ name: createManufacturerName });
                                                            setCreateManufacturerName('');
                                                            setShowCreateManufacturer(false);
                                                        }}>Create</Button>
                                                    </div>
                                                )}
                                            </div>
                                                <div className="grid gap-2">
                                                    {/* machineId and notes removed */}
                                                </div>
                                            </>
                                    ) : (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="file">File</Label>
                                                <Input
                                                    id="file"
                                                    type="file"
                                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                    required={!isLinkMode}
                                                />
                                            </div>
                                            {/* machineId and notes removed */}
                                        </>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        className="bg-[#0089f4] hover:bg-blue-600 w-full"
                                        disabled={
                                            (isLinkMode && createLinkMutation.isLoading) ||
                                            (!isLinkMode && uploadMutation.isPending) ||
                                            (isLinkMode ? !linkUrl || !linkTitle : !uploadFile)
                                        }
                                    >
                                        {isLinkMode ? (
                                            createLinkMutation.isLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Create Link
                                                </>
                                            )
                                        ) : (
                                            uploadMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Upload to Drive
                                                </>
                                            )
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
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
                                                                {(doc.webViewLink || doc.linkUrl) ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-400 hover:text-[#0089f4] hover:bg-blue-50"
                                                                        title="Open document"
                                                                        asChild
                                                                    >
                                                                        <a href={doc.webViewLink || doc.linkUrl} target="_blank" rel="noopener noreferrer">
                                                                            <ExternalLink className="h-4 w-4" />
                                                                        </a>
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-300"
                                                                        title="No preview available"
                                                                        disabled
                                                                    >
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                                                    title="Edit document"
                                                    onClick={() => handleEdit(doc)}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                            {/* Edit Modal (for link documents) */}
                                                            <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetEditForm(); }}>
                                                                <DialogContent className="sm:max-w-[600px]">
                                                                    <form onSubmit={handleEditSave}>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Edit Machine Document</DialogTitle>
                                                                            <DialogDescription>
                                                                                Update the document link and details. Only link-based documents can be edited here.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="grid gap-4 py-4">
                                                                            <div className="grid gap-2">
                                                                                <Label htmlFor="editLinkTitle">Title</Label>
                                                                                <Input id="editLinkTitle" placeholder="Document title" value={editLinkTitle} onChange={(e) => setEditLinkTitle(e.target.value)} />
                                                                            </div>
                                                                            <div className="grid gap-2">
                                                                                <Label htmlFor="editLinkUrl">Link URL</Label>
                                                                                <Input id="editLinkUrl" placeholder="https://..." value={editLinkUrl} onChange={(e) => setEditLinkUrl(e.target.value)} />
                                                                            </div>
                                                                            <div className="grid gap-2">
                                                                                <Label>Category</Label>
                                                                                <div className="flex gap-2">
                                                                                    <select className="flex-1" value={editSelectedCategory} onChange={(e) => setEditSelectedCategory(e.target.value)}>
                                                                                        <option value="">-- Select category --</option>
                                                                                        {categories.map((c: any) => (
                                                                                            <option key={c._id} value={c._id}>{c.name}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                            <div className="grid gap-2">
                                                                                <Label>Manufacturer</Label>
                                                                                <div className="flex gap-2">
                                                                                    <select className="flex-1" value={editSelectedManufacturer} onChange={(e) => setEditSelectedManufacturer(e.target.value)}>
                                                                                        <option value="">-- Select manufacturer --</option>
                                                                                        {manufacturers.map((m: any) => (
                                                                                            <option key={m._id} value={m._id}>{m.name}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <Button
                                                                                type="submit"
                                                                                className="bg-yellow-500 hover:bg-yellow-600 w-full"
                                                                                disabled={updateLinkMutation.isLoading || !editLinkTitle || !editLinkUrl}
                                                                            >
                                                                                {updateLinkMutation.isLoading ? (
                                                                                    <>
                                                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                                        Saving...
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <FileText className="h-4 w-4 mr-2" />
                                                                                        Save Changes
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </form>
                                                                </DialogContent>
                                                            </Dialog>
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
                                            <h3 className="font-bold text-gray-900 truncate" title={doc.title || doc.fileName || 'Document'}>
                                                {doc.title || doc.fileName || 'Untitled Document'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px] font-medium font-mono uppercase">
                                                    {doc.mimeType ? String(doc.mimeType).split('/').pop() : (doc.type === 'link' ? 'link' : 'n/a')}
                                                </Badge>
                                                {doc.fileSize != null && (
                                                    <span className="text-[11px] text-gray-400">{formatFileSize(doc.fileSize)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* notes removed per UI change */}

                                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center text-white text-[10px] font-bold">
                                                    {doc.uploadedBy?.firstName?.[0] || '?'}{doc.uploadedBy?.lastName?.[0] || ''}
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {doc.uploadedBy?.firstName || 'System'}
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
