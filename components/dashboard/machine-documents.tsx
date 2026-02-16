import React, { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface MachineDocument {
  _id: string;
  title: string;
  type: 'file' | 'link';
  linkUrl: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  categoryId?: { name: string };
  manufacturerId?: { name: string };
  uploadedBy: { firstName: string; lastName: string; email: string };
  isActive: boolean;
}

const fetchDocuments = async (type?: 'file' | 'link') => {
  const params = type ? { type } : {};
  const res = await apiService.makeRequest('/machine-documents', { params });
  return res.data;
};

const deleteDocument = async (id: string) => {
  await apiService.makeRequest(`/machine-documents/${id}`, { method: 'DELETE' });
};

export default function MachineDocuments() {
  const [filterType, setFilterType] = useState<'file' | 'link' | undefined>();
  const queryClient = useQueryClient();

  // Fetch categories
  // Always fetch from backend API base URL for categories and manufacturers
  const { data: categoriesData } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500/api';
      const res = await fetch(`${API_BASE}/document-categories`);
      const json = await res.json();
      return json.data || [];
    },
  });
  const { data: manufacturersData } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: async () => {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500/api';
      const res = await fetch(`${API_BASE}/manufacturers`);
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['machine-documents', filterType],
    queryFn: () => fetchDocuments(filterType),
  });

  const mutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries(['machine-documents']),
  });

  // Example select usage for category and manufacturer
  // Replace this with your actual form logic as needed
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');

  return (
    <div>
      <h2>Machine Documents</h2>
      <div>
        <button onClick={() => setFilterType(undefined)}>All</button>
        <button onClick={() => setFilterType('file')}>Files</button>
        <button onClick={() => setFilterType('link')}>Links</button>
      </div>
      <div style={{ display: 'flex', gap: 16, margin: '16px 0' }}>
        <div>
          <label>Category:</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoriesData?.length > 0 ? (
                categoriesData.map((cat: any) => (
                  <SelectItem key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No categories</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label>Manufacturer:</label>
          <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select manufacturer" />
            </SelectTrigger>
            <SelectContent>
              {manufacturersData?.length > 0 ? (
                manufacturersData.map((man: any) => (
                  <SelectItem key={man._id || man.id} value={man._id || man.id}>{man.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No manufacturers</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading documents.</p>}
      <ul>
        {data?.map((doc: MachineDocument) => (
          <li key={doc._id}>
            <strong>{doc.title}</strong> ({doc.type})<br />
            {doc.type === 'file' ? (
              <a href={doc.linkUrl} target="_blank" rel="noopener noreferrer">View File</a>
            ) : (
              <a href={doc.linkUrl} target="_blank" rel="noopener noreferrer">External Link</a>
            )}
            <br />
            Uploaded by: {doc.uploadedBy.firstName} {doc.uploadedBy.lastName} ({doc.uploadedBy.email})
            <br />
            {doc.categoryId && <>Category: {doc.categoryId.name}<br /></>}
            {doc.manufacturerId && <>Manufacturer: {doc.manufacturerId.name}<br /></>}
            <button onClick={() => mutation.mutate(doc._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
