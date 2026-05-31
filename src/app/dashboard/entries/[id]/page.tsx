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
import { Input } from '@/components/ui/Input';
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
  X,
  Sparkles
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
  
  const { activeWorkspace, user, members, profile } = useWorkspace();
  const { isUploading, uploadFile, getDownloadUrl, deleteFile } = useFileUpload();
  const { isExporting, exportEntryToPDF } = useExportPDF();

  const [entry, setEntry] = useState<LabEntry | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [signatureName, setSignatureName] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // File to delete state
  const [fileToDelete, setFileToDelete] = useState<{ id: string; path: string } | null>(null);

  // Role permissions evaluation
  const currentMember = members.find(m => m.user_id === user?.id);
  const rawRole = currentMember?.role || 'viewer';
  const activeWorkspaceSettings = activeWorkspace?.settings as any;
  const userRole = activeWorkspaceSettings?.member_roles?.[user?.id] || rawRole;

  const canEditOrDelete = entry && entry.status !== 'approved' && userRole !== 'viewer';
  const canReview = entry && entry.status === 'review' && (userRole === 'admin' || userRole === 'owner' || userRole === 'reviewer');
  const canSubmitForReview = entry && (entry.status === 'draft' || entry.status === 'in_progress') && userRole !== 'viewer';

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

      setAiSummary(entryData.metadata?.ai_summary || '');

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

  const submitForReview = async () => {
    setIsSubmittingReview(true);
    try {
      const { error } = await (supabase.from('lab_entries') as any)
        .update({
          status: 'review',
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;

      // Log activity
      await (supabase.from('activity_logs') as any).insert({
        workspace_id: activeWorkspace!.id,
        user_id: user!.id,
        action: 'submit_review',
        entity_type: 'lab_entry',
        entity_id: entryId,
        metadata: { title: entry?.title }
      });

      toast.success('Experiment submitted for review!');
      fetchEntryDetails();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to submit for review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const signAndApprove = async () => {
    if (!signatureName.trim()) {
      toast.error('Please enter your full name to sign');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const updatedMetadata = {
        ...(entry?.metadata as object || {}),
        signature: {
          signed_by: signatureName.trim(),
          signed_at: new Date().toISOString(),
          signer_email: user?.email || '',
          signer_id: user?.id || ''
        },
        rejection: null
      };

      const { error } = await (supabase.from('lab_entries') as any)
        .update({
          status: 'approved',
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;

      // Log activity
      await (supabase.from('activity_logs') as any).insert({
        workspace_id: activeWorkspace!.id,
        user_id: user!.id,
        action: 'sign_off',
        entity_type: 'lab_entry',
        entity_id: entryId,
        metadata: { title: entry?.title }
      });

      toast.success('Experiment signed & approved successfully!');
      setShowSignModal(false);
      fetchEntryDetails();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to approve experiment');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const rejectEntry = async () => {
    if (!rejectionComment.trim()) {
      toast.error('Please enter a rejection comment');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const existingHistory = (entry?.metadata as any)?.rejection_history || [];
      const newRejection = {
        comment: rejectionComment.trim(),
        rejected_by: profile?.display_name || user?.email || 'Reviewer',
        rejected_at: new Date().toISOString(),
        rejected_by_id: user?.id || ''
      };

      const updatedMetadata = {
        ...(entry?.metadata as object || {}),
        rejection: newRejection,
        rejection_history: [newRejection, ...existingHistory]
      };

      const { error } = await (supabase.from('lab_entries') as any)
        .update({
          status: 'draft',
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;

      // Log activity
      await (supabase.from('activity_logs') as any).insert({
        workspace_id: activeWorkspace!.id,
        user_id: user!.id,
        action: 'reject',
        entity_type: 'lab_entry',
        entity_id: entryId,
        metadata: { title: entry?.title, comment: rejectionComment.trim() }
      });

      toast.success('Experiment returned to Draft with comments.');
      setShowRejectModal(false);
      setRejectionComment('');
      fetchEntryDetails();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to reject experiment');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const triggerPdfExport = () => {
    if (entry && activeWorkspace) {
      exportEntryToPDF(entry, activeWorkspace.name);
    }
  };

  const generateAiSummary = async () => {
    if (!entry) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: entry.content,
          title: entry.title
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const data = await response.json();
      const summary = data.summary;
      
      // Update metadata json column
      const updatedMetadata = {
        ...(entry.metadata as object || {}),
        ai_summary: summary
      };
      
      const { error } = await (supabase.from('lab_entries') as any)
        .update({ metadata: updatedMetadata } as any)
        .eq('id', entry.id);
         
      if (error) throw error;
      
      setAiSummary(summary);
      setEntry(prev => prev ? { ...prev, metadata: updatedMetadata } : null);
      toast.success(data.isMock ? 'Demo insights compiled!' : 'Gemini insights generated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate AI insights');
    } finally {
      setIsSummarizing(false);
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
          {canEditOrDelete && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Rejection Notification Banner */}
      {(entry.metadata as any)?.rejection && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-xs text-amber-800 shadow-xs">
          <span className="font-bold text-sm shrink-0">⚠️ Revision Requested:</span>
          <div>
            <p className="font-bold text-amber-900">
              Returned to Draft by {(entry.metadata as any).rejection.rejected_by} on {format(new Date((entry.metadata as any).rejection.rejected_at), 'PPP p')}
            </p>
            <p className="mt-1 leading-relaxed italic text-amber-700">"{(entry.metadata as any).rejection.comment}"</p>
          </div>
        </div>
      )}

      {/* Signature Seal Banner */}
      {entry.status === 'approved' && (entry.metadata as any)?.signature && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-emerald-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-950">Electronically Signed & Approved</p>
              <p className="mt-0.5 text-emerald-700">
                Signer: <span className="font-bold">{(entry.metadata as any).signature.signed_by}</span> ({(entry.metadata as any).signature.signer_email})
              </p>
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <p className="font-bold text-emerald-950">Signing Time</p>
            <p className="mt-0.5 text-emerald-700">{format(new Date((entry.metadata as any).signature.signed_at), 'PPP p')}</p>
          </div>
        </div>
      )}

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
                    entry.status === 'approved' ? 'accent' :
                    entry.status === 'in_progress' ? 'primary' :
                    entry.status === 'draft' ? 'zinc' : 'warning'
                  }
                  styleType="solid"
                >
                  {entry.status === 'in_progress' ? 'In Progress' :
                   entry.status === 'draft' ? 'Draft' :
                   entry.status === 'review' ? 'Review' :
                   entry.status === 'approved' ? 'Approved' : entry.status}
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

          {/* AI Insights Section */}
          <div className="p-5 rounded-xl bg-violet-50/40 border border-violet-100/80 flex flex-col gap-3 text-xs shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-violet-950">
                <Sparkles className="h-4.5 w-4.5 text-violet-650 animate-pulse" />
                <span className="text-sm font-semibold">Gemini AI Executive Summary</span>
              </div>
              <button
                onClick={generateAiSummary}
                disabled={isSummarizing}
                className="text-[10px] font-bold text-violet-750 hover:text-violet-900 transition flex items-center gap-1 disabled:opacity-50 cursor-pointer bg-white border border-violet-200 px-2.5 py-1 rounded-md shadow-2xs"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Summarizing...
                  </>
                ) : aiSummary ? (
                  'Regenerate Summary'
                ) : (
                  'Generate Summary'
                )}
              </button>
            </div>
            
            {aiSummary ? (
              <p className="text-zinc-700 leading-relaxed italic pr-2 font-medium">
                "{aiSummary}"
              </p>
            ) : (
              <div className="flex items-center justify-between gap-4 py-1 text-zinc-450 font-medium">
                <span>No executive summary compiled for this experiment log yet. Generate one with Gemini AI.</span>
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

      {/* Submit for Review Action Panel */}
      {canSubmitForReview && (
        <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-bold text-zinc-900 text-sm">Submit for Review</p>
            <p className="text-zinc-500 mt-1">Ready to seal this record? Submit it to lock editing and request review signature sign-off.</p>
          </div>
          <Button 
            size="sm" 
            onClick={submitForReview} 
            isLoading={isSubmittingReview}
            className="cursor-pointer font-bold shrink-0 bg-primary"
          >
            Submit Log
          </Button>
        </div>
      )}

      {/* Review Actions Panel */}
      {canReview && (
        <div className="p-5 bg-indigo-50 border border-indigo-150 rounded-xl space-y-3 shadow-xs">
          <h4 className="text-sm font-bold text-indigo-955">Review Board Decision Required</h4>
          <p className="text-xs text-indigo-700 leading-relaxed">
            This experiment has been submitted for review. Please verify the findings and choose to sign off or return for edits.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1.5">
            <Button 
              size="sm" 
              onClick={() => setShowSignModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Sign & Approve
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowRejectModal(true)}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold bg-white cursor-pointer"
            >
              Request Revisions
            </Button>
          </div>
        </div>
      )}

      {/* 3. File Attachments Panel */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-indigo-650" />
            <h3 className="font-bold text-zinc-900 text-sm sm:text-base">File Attachments ({files.length})</h3>
          </div>
          
          {/* Hidden File Input */}
          {canEditOrDelete && (
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
          )}
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
                  {canEditOrDelete && (
                    <button
                      onClick={() => handleFileDelete(file.id, file.file_url)}
                      className="p-1.5 rounded-md hover:bg-rose-50 text-zinc-450 hover:text-rose-600 transition cursor-pointer"
                      title="Delete File"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
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

      {/* Sign & Approve Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Compliance Electronic Signature</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              By typing your full name below, you certify that you have reviewed this experiment record and confirm it meets all laboratory compliance and QA requirements.
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Full Signature Name</label>
              <Input 
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Type your full name to sign"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowSignModal(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={signAndApprove} 
                isLoading={isSubmittingReview}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                Sign & Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Revisions Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Request Revision</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Explain why this experiment is being returned to the author. Specify what modifications, checks, or data corrections are required.
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Rejection Comment</label>
              <textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Enter revision instructions..."
                className="w-full text-xs p-3 border border-zinc-200 rounded-lg min-h-[100px] focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={rejectEntry} 
                isLoading={isSubmittingReview}
                className="font-bold cursor-pointer"
              >
                Return to Author
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
