'use client';

// Prevent static prerendering of this auth-protected route at build time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useExportPDF } from '@/hooks/useExportPDF';
import { createClient } from '@/lib/supabase/client';
import { LabEntry } from '@/hooks/useEntries';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileTypeIcon } from '@/components/ui/FileTypeIcon';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download, 
  Paperclip, 
  Calendar, 
  User, 
  Tag as TagIcon,
  Loader2,
  ExternalLink,
  FlaskConical,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface EntryDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EntryDetailsPage({ params }: EntryDetailsPageProps) {
  const router = useRouter();
  // Unwrap params using React.use()
  const { id: entryId } = use(params);
  const supabase = createClient();
  
  const { activeWorkspace } = useWorkspace();
  const { isUploading, uploadFile, getDownloadUrl, deleteFile } = useFileUpload();
  const { isExporting, exportEntryToPDF } = useExportPDF();

  const [entry, setEntry] = useState<LabEntry | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // File to delete state
  const [fileToDelete, setFileToDelete] = useState<{ id: string; path: string } | null>(null);

  const fetchEntryDetails = useCallback(async () => {
    if (!entryId) return;
    try {
      // 1. Fetch entry joined with author profile and tags
      const { data, error } = await supabase
        .from('lab_entries')
        .select(`
          *,
          author:profiles!lab_entries_author_id_fkey(*),
          entry_tags(tag:tags(*))
        `)
        .eq('id', entryId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        toast.error('Lab entry not found');
        router.push('/dashboard/entries');
        return;
      }

      const entryData = data as any;
      const tags = (entryData.entry_tags || [])
        .filter((et: any) => et.tag !== null)
        .map((et: any) => et.tag);

      setEntry({
        ...entryData,
        tags
      } as LabEntry);

      // 2. Fetch associated files
      const { data: filesData } = await supabase
        .from('files')
        .select('*')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: false });

      if (filesData) setFiles(filesData);

    } catch (err) {
      console.error('Error loading entry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entryId, supabase, router]);

  useEffect(() => {
    fetchEntryDetails();
  }, [fetchEntryDetails]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      await uploadFile(file, entryId);
    }
    
    // Refresh files list
    fetchEntryDetails();
  };

  const handleFileDownload = async (fileName: string, fileUrl: string) => {
    // Generate storage path: workspaceId/entryId/timestamp-filename
    // We can extract it from fileUrl or we can query storage objects.
    // However, since we saved the storage_path in entry_files, we can use it!
    // If not found, extract path segments from public URL
    let storagePath = '';
    try {
      const urlObj = new URL(fileUrl);
      const pathSegments = decodeURIComponent(urlObj.pathname).split('/');
      // The storage path segments inside public url usually have 'object/public/lab-files/...'
      const bucketIndex = pathSegments.indexOf('lab-files');
      if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
        storagePath = pathSegments.slice(bucketIndex + 1).join('/');
      }
    } catch (err) {
      console.error(err);
    }

    if (!storagePath && activeWorkspace) {
      // Fallback: search files metadata or construct from workspaceId/entryId
      // Because we prefixed it in uploadFile, let's extract the part after lab-files/
      const parts = fileUrl.split('/lab-files/');
      if (parts.length > 1) {
        storagePath = decodeURIComponent(parts[1]);
      }
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

  const handleFileDelete = async (fileId: string, fileUrl: string) => {
    let storagePath = '';
    const parts = fileUrl.split('/lab-files/');
    if (parts.length > 1) {
      storagePath = decodeURIComponent(parts[1]);
    }

    if (!storagePath) {
      toast.error('Could not resolve file storage location');
      return;
    }

    setFileToDelete({ id: fileId, path: storagePath });
  };

  const confirmFileDelete = async () => {
    if (!fileToDelete) return;
    const success = await deleteFile(fileToDelete.id, fileToDelete.path);
    if (success) {
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
    }
    setFileToDelete(null);
  };

  const handleEntryDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await (supabase.from('lab_entries') as any)
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', entryId);

      if (error) throw error;
      toast.success('Notebook entry deleted successfully');
      router.push('/dashboard/entries');
    } catch (err) {
      console.error('Failed to delete entry:', err);
      toast.error('Failed to delete notebook entry');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const triggerPdfExport = () => {
    if (entry && activeWorkspace) {
      exportEntryToPDF(entry, activeWorkspace.name);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-white border border-zinc-200 rounded-xl animate-pulse">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* 1. Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/entries">
            <Button variant="ghost" size="sm" className="p-1.5 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-zinc-500 hover:text-zinc-800" />
            </Button>
          </Link>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Notebook Record</span>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight line-clamp-1">{entry.title}</h1>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" size="sm" onClick={triggerPdfExport} isLoading={isExporting} className="bg-white cursor-pointer">
            <Download className="h-4 w-4 mr-1.5" /> PDF Export
          </Button>
          <Link href={`/dashboard/entries/${entry.id}/edit`}>
            <Button variant="secondary" size="sm" className="cursor-pointer">
              <Edit className="h-4 w-4 mr-1.5" /> Edit Log
            </Button>
          </Link>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => setShowDeleteConfirm(true)}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      {/* 2. Main Sheet Content */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        {/* Lab Accent Top Bar */}
        <div className="h-2 bg-indigo-600 w-full" />
        
        <div className="p-6 md:p-8 space-y-6">
          {/* Header Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-lg bg-zinc-50 border border-zinc-150 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-zinc-400 uppercase tracking-wider">Author</p>
              <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                <User className="h-3.5 w-3.5 text-zinc-400" />
                <span>{entry.author?.display_name || 'Staff Member'}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="font-semibold text-zinc-400 uppercase tracking-wider">Date Logged</p>
              <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>{format(new Date(entry.created_at), 'PPP p')}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-zinc-400 uppercase tracking-wider">Status</p>
              <div>
                <Badge
                  variant={
                    entry.status === 'Completed' ? 'accent' :
                    entry.status === 'In Progress' ? 'primary' :
                    entry.status === 'Draft' ? 'zinc' : 'warning'
                  }
                  styleType="solid"
                >
                  {entry.status}
                </Badge>
              </div>
            </div>

            {entry.sample_name && (
              <div className="space-y-1">
                <p className="font-semibold text-zinc-400 uppercase tracking-wider">Sample Name</p>
                <div className="flex items-center gap-1.5 text-zinc-800 font-semibold">
                  <FlaskConical className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{entry.sample_name}</span>
                </div>
              </div>
            )}

            {entry.tags.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <p className="font-semibold text-zinc-400 uppercase tracking-wider">Associated Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entry.tags.map((tag: any) => (
                    <Badge key={tag.id} variant={tag.color as any} styleType="subtle" className="text-[10px]">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <hr className="border-zinc-100" />

          {/* Document Content Render */}
          <article className="prose max-w-none text-zinc-850">
            <div 
              dangerouslySetInnerHTML={{ __html: entry.content || '<p className="text-zinc-400 italic">No notes logged.</p>' }} 
            />
          </article>
        </div>
      </div>

      {/* 3. File Attachments Panel */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-indigo-650" />
            <h3 className="font-bold text-zinc-900 text-sm sm:text-base">File Attachments ({files.length})</h3>
          </div>
          
          {/* Hidden File Input */}
          <label className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 cursor-pointer transition select-none">
            <Paperclip className="h-3.5 w-3.5 mr-1" /> Attach File
            <input 
              type="file" 
              multiple 
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={isUploading}
            />
          </label>
        </div>

        {isUploading && (
          <div className="flex items-center justify-center p-4 border border-indigo-100 rounded-lg bg-indigo-50/50 text-xs text-primary font-medium gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Uploading file attachments...
          </div>
        )}

        {files.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-4 text-center">No files attached to this experiment log yet. PDF reports, Excel tables, or raw analytics are permitted.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 hover:bg-zinc-50/30 transition group text-xs bg-white"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-2 bg-zinc-50 border border-zinc-150 rounded-lg text-zinc-500 shrink-0">
                    <FileTypeIcon mimeType={file.file_type} fileName={file.file_name} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 truncate" title={file.file_name}>
                      {file.file_name}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {(file.file_size / (1024 * 1024)).toFixed(2)} MB • {file.file_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-4">
                  <button
                    onClick={() => handleFileDownload(file.file_name, file.file_url)}
                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
                    title="Download File"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileDelete(file.id, file.file_url)}
                    className="p-1.5 rounded-md hover:bg-rose-50 text-zinc-450 hover:text-rose-600 transition cursor-pointer"
                    title="Delete File"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      {/* Delete Entry */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleEntryDelete}
        title="Delete Experiment Log"
        description="Are you absolutely sure you want to delete this log? This action is destructive and cannot be undone."
        confirmText="Delete Record"
        isDestructive
        isLoading={isDeleting}
      />

      {/* Delete File */}
      <ConfirmDialog
        isOpen={fileToDelete !== null}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmFileDelete}
        title="Delete Attached File"
        description="Are you sure you want to remove this attachment from the experiment record?"
        confirmText="Remove File"
        isDestructive
      />

    </div>
  );
}
