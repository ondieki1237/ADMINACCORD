import React, { useState } from "react";
import { apiService, API_BASE_URL } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Category {
  _id: string;
  name: string;
}

interface Manufacturer {
  _id: string;
  name: string;
}

interface MachineDocument {
  _id: string;
  title: string;
  type: "file" | "link";
  linkUrl: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  categoryId?: { name: string };
  manufacturerId?: { name: string };
  uploadedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  isActive: boolean;
}

const fetchDocuments = async (type?: "file" | "link"): Promise<MachineDocument[]> => {
  const params = type ? { type } : {};
  const res = await apiService.makeRequest("/machine-documents", { params });

  return res.data ?? [];
};

const deleteDocument = async (id: string) => {
  await apiService.makeRequest(`/machine-documents/${id}`, {
    method: "DELETE",
  });
};

export default function MachineDocuments() {
  const queryClient = useQueryClient();

  const [filterType, setFilterType] = useState<"file" | "link" | undefined>();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");

  /* ----------------------------- Categories ----------------------------- */

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/document-categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");

      const json = await res.json();
      return json.data ?? [];
    },
  });

  /* --------------------------- Manufacturers ---------------------------- */

  const { data: manufacturersData = [] } = useQuery<Manufacturer[]>({
    queryKey: ["manufacturers"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/manufacturers`);
      if (!res.ok) throw new Error("Failed to fetch manufacturers");

      const json = await res.json();
      return json.data ?? [];
    },
  });

  /* ---------------------------- Documents ---------------------------- */

  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery<MachineDocument[]>({
    queryKey: ["machine-documents", filterType],
    queryFn: () => fetchDocuments(filterType),
  });

  /* ----------------------------- Delete ----------------------------- */

  const mutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["machine-documents"],
      });
    },
  });

  /* ----------------------------- UI ----------------------------- */

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Machine Documents</h2>

      {/* Filter Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilterType(undefined)}
          className="px-3 py-1 border rounded"
        >
          All
        </button>

        <button
          onClick={() => setFilterType("file")}
          className="px-3 py-1 border rounded"
        >
          Files
        </button>

        <button
          onClick={() => setFilterType("link")}
          className="px-3 py-1 border rounded"
        >
          Links
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-6">
        {/* Category */}
        <div>
          <label className="block mb-1 text-sm font-medium">Category</label>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>

            <SelectContent>
              {categoriesData.length > 0 ? (
                categoriesData.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No categories
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Manufacturer */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            Manufacturer
          </label>

          <Select
            value={selectedManufacturer}
            onValueChange={setSelectedManufacturer}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select manufacturer" />
            </SelectTrigger>

            <SelectContent>
              {manufacturersData.length > 0 ? (
                manufacturersData.map((man) => (
                  <SelectItem key={man._id} value={man._id}>
                    {man.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No manufacturers
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && <p>Loading documents...</p>}

      {/* Error */}
      {error && <p className="text-red-500">Error loading documents</p>}

      {/* Empty */}
      {!isLoading && documents.length === 0 && (
        <p>No documents available.</p>
      )}

      {/* Documents */}
      <ul className="space-y-4">
        {documents.map((doc) => (
          <li
            key={doc._id}
            className="border rounded p-4 shadow-sm bg-white"
          >
            <h3 className="font-semibold text-lg">{doc.title}</h3>

            <p className="text-sm text-gray-500">Type: {doc.type}</p>

            <div className="mt-2">
              <a
                href={doc.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {doc.type === "file" ? "View File" : "Open Link"}
              </a>
            </div>

            <p className="text-sm mt-2">
              Uploaded by: {doc.uploadedBy.firstName}{" "}
              {doc.uploadedBy.lastName} ({doc.uploadedBy.email})
            </p>

            {doc.categoryId && (
              <p className="text-sm">Category: {doc.categoryId.name}</p>
            )}

            {doc.manufacturerId && (
              <p className="text-sm">
                Manufacturer: {doc.manufacturerId.name}
              </p>
            )}

            <button
              onClick={() => mutation.mutate(doc._id)}
              className="mt-3 px-3 py-1 bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}