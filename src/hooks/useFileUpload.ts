'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import toast from 'react-hot-toast';

export function useFileUpload() {
  const supabase = createClient();
  const { activeWorkspace, settings } = useWorkspace();
  const [isUploading, setIsUploading] = useState(false);

  // Wildcard file extension / mime type checker
  const isValidMimeType = (fileType: string, fileName: string, allowedTypes: string[]) => {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    
    const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;
    return allowedTypes.some((pattern) => {
      if (pattern.startsWith('.')) {
        return pattern.toLowerCase() === ext;
      }
      if (pattern.endsWith('/*')) {
        const base = pattern.replace('/*', '');
        return fileType.startsWith(base);
      }
      return pattern.toLowerCase() === fileType.toLowerCase();
    });
  };

  const uploadFile = useCallback(async (file: File, entryId: string) => {
    if (!activeWorkspace) {
      toast.error('No active workspace selected');
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be signed in to upload files');
      return null;
    }

    // 1. Validate file size constraints
    const maxMb = settings?.max_file_size_mb || 10;
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`File size exceeds maximum limit of ${maxMb}MB`);
      return null;
    }

    // 2. Validate allowed mime types
    const allowed = settings?.allowed_mime_types || ['*/*'];
    const isAllowed = allowed.includes('*/*') || isValidMimeType(file.type, file.name, allowed);
    if (!isAllowed) {
      toast.error('File type is not permitted in this workspace');
      return null;
    }

    setIsUploading(true);

    try {
      // 3. Create unique path prefix under: workspaceId/entryId/timestamp-filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${activeWorkspace.id}/${entryId}/${Date.now()}-${sanitizedName}`;

      // 4. Upload file to Supabase storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('lab-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) throw storageError;

      // 5. Get file public URL (or signed helper path)
      const { data: { publicUrl } } = supabase.storage
        .from('lab-files')
        .getPublicUrl(storagePath);

      // 6. Insert metadata into BOTH 'files' and 'entry_files' tables
      // For files table
      const { data: fileData, error: fileError } = await (supabase.from('files') as any)
        .insert({
          workspace_id: activeWorkspace.id,
          entry_id: entryId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type || file.name.split('.').pop() || 'unknown',
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // For entry_files table (duplicate records for database integrity)
      const { error: entryFileError } = await (supabase.from('entry_files') as any)
        .insert({
          workspace_id: activeWorkspace.id,
          entry_id: entryId,
          uploaded_by: user.id,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
          is_deleted: false,
        });

      if (entryFileError) {
        console.error('Failed to sync metadata to entry_files:', entryFileError);
      }

      toast.success('File uploaded successfully!');
      return fileData;
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(err.message || 'File upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [activeWorkspace, settings, supabase]);

  const getDownloadUrl = async (storagePath: string) => {
    try {
      // Since our storage bucket is private, generate a temporary signed URL for viewing/download
      const { data, error } = await supabase.storage
        .from('lab-files')
        .createSignedUrl(storagePath, 300); // 5-minute expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Failed to generate download URL:', err);
      toast.error('Failed to access file download link');
      return null;
    }
  };

  const deleteFile = async (fileId: string, storagePath: string) => {
    try {
      // 1. Delete object from storage bucket
      const { error: storageError } = await supabase.storage
        .from('lab-files')
        .remove([storagePath]);

      if (storageError) {
        console.warn('Failed to delete storage file (it may have been deleted already):', storageError);
      }

      // 2. Delete metadata from files table
      const { error: fileError } = await (supabase.from('files') as any)
        .delete()
        .eq('id', fileId);

      if (fileError) throw fileError;

      // 3. Mark soft deleted in entry_files
      await (supabase.from('entry_files') as any)
        .update({ is_deleted: true })
        .eq('storage_path', storagePath);

      toast.success('File deleted successfully');
      return true;
    } catch (err: any) {
      console.error('Failed to delete file:', err);
      toast.error('Failed to delete file');
      return false;
    }
  };

  return {
    isUploading,
    uploadFile,
    getDownloadUrl,
    deleteFile,
  };
}
