'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import toast from 'react-hot-toast';

type LabEntry = Database['public']['Tables']['lab_entries']['Row'] & {
  author: Database['public']['Tables']['profiles']['Row'] | null;
  tags: Database['public']['Tables']['tags']['Row'][];
};

interface FetchEntriesOptions {
  status?: string;
  tagId?: string;
  search?: string;
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export function useEntries() {
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();
  const [entries, setEntries] = useState<LabEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEntries = useCallback(async (options: FetchEntriesOptions = {}) => {
    if (!activeWorkspace) return;
    setIsLoading(true);

    try {
      const {
        status,
        tagId,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = options;

      // Start building query
      // Join author profile and tag details through entry_tags junction table
      let query = supabase
        .from('lab_entries')
        .select(`
          *,
          author:profiles!lab_entries_author_id_fkey(id, display_name, avatar_url, email),
          entry_tags(tag:tags(*))
        `, { count: 'exact' })
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_deleted', false);

      // Filter by status
      if (status && status !== 'All') {
        query = query.eq('status', status);
      }

      // Filter by search (title, content, sample name)
      if (search && search.trim() !== '') {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,sample_name.ilike.%${search}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;

      if (error) throw error;

      // Parse tags from joining results and set state
      let parsedData = (data || []).map((entry: any) => {
        const tags = (entry.entry_tags || [])
          .filter((et: any) => et.tag !== null)
          .map((et: any) => et.tag);
        return {
          ...entry,
          tags,
        };
      }) as LabEntry[];

      // Filter by tag if selected (PostgREST joining filters do not filter out parent records)
      if (tagId && tagId !== 'All') {
        parsedData = parsedData.filter((entry) => entry.tags.some((t) => t.id === tagId));
      }

      setEntries(parsedData);
      setTotalCount(count || parsedData.length);
    } catch (err: any) {
      console.error('Error fetching entries:', err);
      toast.error('Failed to load lab entries');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, supabase]);

  const createEntry = async (entry: {
    title: string;
    content: string;
    sample_name?: string;
    status: string;
    tagIds: string[];
    metadata?: any;
  }) => {
    if (!activeWorkspace) throw new Error('No active workspace');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    try {
      // 1. Insert entry record
      const { data: entryData, error: entryError } = await supabase
        .from('lab_entries')
        .insert({
          workspace_id: activeWorkspace.id,
          author_id: user.id,
          title: entry.title,
          content: entry.content,
          sample_name: entry.sample_name || null,
          status: entry.status,
          metadata: entry.metadata || {},
          is_deleted: false,
        } as any)
        .select()
        .single();

      if (entryError) throw entryError;

      const createdEntry = entryData as any;

      // 2. Link tags if any are selected
      if (entry.tagIds && entry.tagIds.length > 0) {
        const tagLinks = entry.tagIds.map((tagId) => ({
          entry_id: createdEntry.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('entry_tags')
          .insert(tagLinks as any);

        if (tagError) throw tagError;
      }

      toast.success('Lab entry created successfully!');
      return createdEntry;
    } catch (err: any) {
      console.error('Error creating entry:', err);
      toast.error(err.message || 'Failed to create lab entry');
      throw err;
    }
  };

  const updateEntry = async (
    entryId: string,
    updates: {
      title?: string;
      content?: string;
      sample_name?: string;
      status?: string;
      tagIds?: string[];
      metadata?: any;
    }
  ) => {
    try {
      // 1. Update entry record
      const { error: entryError } = await (supabase.from('lab_entries') as any)
        .update({
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.content !== undefined && { content: updates.content }),
          ...(updates.sample_name !== undefined && { sample_name: updates.sample_name || null }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.metadata !== undefined && { metadata: updates.metadata }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (entryError) throw entryError;

      // 2. Manage tag linkages if provided
      if (updates.tagIds !== undefined) {
        // Delete all old tag associations
        const { error: deleteError } = await supabase
          .from('entry_tags')
          .delete()
          .eq('entry_id', entryId);

        if (deleteError) throw deleteError;

        // Insert new associations
        if (updates.tagIds.length > 0) {
          const tagLinks = updates.tagIds.map((tagId) => ({
            entry_id: entryId,
            tag_id: tagId,
          }));

          const { error: tagInsertError } = await supabase
            .from('entry_tags')
            .insert(tagLinks as any);

          if (tagInsertError) throw tagInsertError;
        }
      }

      toast.success('Lab entry updated successfully!');
    } catch (err: any) {
      console.error('Error updating entry:', err);
      toast.error(err.message || 'Failed to update lab entry');
      throw err;
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      // Perform soft delete
      const { error } = await (supabase.from('lab_entries') as any)
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', entryId);

      if (error) throw error;
      toast.success('Lab entry deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      toast.error('Failed to delete lab entry');
      throw err;
    }
  };

  return {
    entries,
    isLoading,
    totalCount,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
export type { LabEntry };
