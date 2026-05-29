'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useFileUpload } from '@/hooks/useFileUpload';
import { createClient } from '@/lib/supabase/client';
import { FileTypeIcon } from '@/components/ui/FileTypeIcon';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { 
  Search, 
  FolderClosed, 
  Download, 
  Trash2, 
  ExternalLink, 
  Loader2,
  HardDrive
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function FilesPage() {
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();
  const { getDownloadUrl, deleteFile } = useFileUpload();

  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; url: string } | null>(null);

  const fetchWorkspaceFiles = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*, entry:lab_entries(id, title)')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching workspace files:', err);
      toast.error('Failed to load file explorer list');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, supabase]);

  useEffect(() => {
    fetchWorkspaceFiles();
  }, [fetchWorkspaceFiles]);

  const handleDownload = async (fileUrl: string) => {
    let storagePath = '';
    const parts = fileUrl.split('/lab-files/');
    if (parts.length > 1) {
      storagePath = decodeURIComponent(parts[1]);
    }

    if (!storagePath) {
      toast.error('Could not resolve file location');
      return;
    }

    const downloadUrl = await getDownloadUrl(storagePath);
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleFileDeleteClick = (fileId: string, fileUrl: string) => {
    setFileToDelete({ id: fileId, url: fileUrl });
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    
    let storagePath = '';
    const parts = fileToDelete.url.split('/lab-files/');
    if (parts.length > 1) {
      storagePath = decodeURIComponent(parts[1]);
    }

    if (!storagePath) {
      toast.error('Could not resolve file storage location');
      return;
    }

    const success = await deleteFile(fileToDelete.id, storagePath);
    if (success) {
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
    }
    setFileToDelete(null);
  };

  // Filter files by search query and type
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.file_name.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === 'All') return matchesSearch;
    if (filterType === 'PDF') return matchesSearch && file.file_type === 'application/pdf';
    if (filterType === 'Image') return matchesSearch && file.file_type.startsWith('image/');
    if (filterType === 'Spreadsheet') {
      return (
        matchesSearch &&
        (file.file_type.includes('spreadsheet') ||
          file.file_type.includes('csv') ||
          file.file_type.includes('excel') ||
          file.file_name.endsWith('.xlsx') ||
          file.file_name.endsWith('.csv'))
      );
    }
    return matchesSearch;
  });

  // Calculate total space used
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.file_size || 0), 0);
  const totalSizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  const fileTypeOptions = [
    { value: 'All', label: 'All Formats' },
    { value: 'PDF', label: 'PDF Records' },
    { value: 'Image', label: 'Images / Spectra' },
    { value: 'Spreadsheet', label: 'Spreadsheets / CSV' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Files Explorer</h1>
          <p className="text-sm text-zinc-500">Access and download scientific raw data attachments.</p>
        </div>
        
        {/* Storage usage widget */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-zinc-200 shadow-xs text-xs font-semibold text-zinc-600">
          <HardDrive className="h-4.5 w-4.5 text-indigo-650" />
          <span>Space Used: <strong className="text-zinc-900">{totalSizeMb} MB</strong></span>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:flex-1 relative space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Search Files</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search file name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 h-10 w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="w-full sm:w-56 space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Format</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            {fileTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Files Grid View */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center bg-white border border-zinc-200 rounded-xl">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <EmptyState
          icon={FolderClosed}
          title="No files found"
          description="Either search queries do not match or no files have been uploaded to experiment logs yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <div 
              key={file.id} 
              className="flex flex-col bg-white border border-zinc-200 rounded-xl hover:shadow-md hover:border-zinc-300 transition duration-200 overflow-hidden shadow-xs"
            >
              <div className="p-5 flex-1 flex gap-3.5 items-start">
                <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-500 shrink-0">
                  <FileTypeIcon mimeType={file.file_type} fileName={file.file_name} className="h-6 w-6" />
                </div>
                
                <div className="min-w-0 space-y-1">
                  <p className="font-bold text-zinc-950 text-sm truncate" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {(file.file_size / (1024 * 1024)).toFixed(3)} MB • {file.file_type.split('/').pop()?.toUpperCase()}
                  </p>
                  
                  {file.entry && (
                    <div className="pt-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 block">Linked Log</span>
                      <Link 
                        href={`/dashboard/entries/${file.entry.id}`}
                        className="inline-flex items-center text-[11px] font-semibold text-primary hover:text-primary-dark hover:underline truncate max-w-full"
                      >
                        {file.entry.title} <ExternalLink className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Uploaded {format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownload(file.file_url)}
                    className="h-7.5 bg-white cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Get File
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleFileDeleteClick(file.id, file.file_url)}
                    className="h-7.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={fileToDelete !== null}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDeleteFile}
        title="Delete Analytical File"
        description="Are you sure you want to permanently remove this file from your lab storage? The reference link inside the lab entry will also be broken."
        confirmText="Remove Attachment"
        isDestructive
      />

    </div>
  );
}
