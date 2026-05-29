'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useEntries } from '@/hooks/useEntries';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TagInput, Tag } from '@/components/ui/TagInput';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface EditEntryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditEntryPage({ params }: EditEntryPageProps) {
  const router = useRouter();
  const { id: entryId } = use(params);
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();
  const { updateEntry } = useEntries();

  // Form states
  const [title, setTitle] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [content, setContent] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Available tags in workspace
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const fetchEntryDetails = useCallback(async () => {
    if (!entryId) return;
    try {
      // 1. Fetch entry details
      const { data, error } = await supabase
        .from('lab_entries')
        .select(`
          *,
          entry_tags(tag_id)
        `)
        .eq('id', entryId)
        .eq('is_deleted', false)
        .single();

      if (error || !data) {
        toast.error('Lab entry not found');
        router.push('/dashboard/entries');
        return;
      }

      const entryData = data as any;
      setTitle(entryData.title);
      setSampleName(entryData.sample_name || '');
      setStatus(entryData.status);
      setContent(entryData.content || '<p></p>');
      
      const tagIds = (entryData.entry_tags || []).map((et: any) => et.tag_id);
      setSelectedTagIds(tagIds);

      // 2. Fetch workspace tags
      if (activeWorkspace) {
        const { data: tagsData } = await supabase
          .from('tags')
          .select('*')
          .eq('workspace_id', activeWorkspace.id);
        if (tagsData) setAvailableTags(tagsData);
      }

    } catch (err) {
      console.error('Error loading entry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entryId, activeWorkspace, supabase, router]);

  useEffect(() => {
    if (activeWorkspace) {
      fetchEntryDetails();
    }
  }, [activeWorkspace, fetchEntryDetails]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleTagCreate = async (name: string, color: string) => {
    if (!activeWorkspace) return;
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          workspace_id: activeWorkspace.id,
          name,
          color,
        } as any)
        .select()
        .single();

      if (error) throw error;
      const createdTag = data as any;
      setAvailableTags((prev) => [...prev, createdTag]);
      setSelectedTagIds((prev) => [...prev, createdTag.id]);
      toast.success(`Tag "${name}" created!`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to create tag');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      await updateEntry(entryId, {
        title: title.trim(),
        content,
        sample_name: sampleName.trim() || undefined,
        status,
        tagIds: selectedTagIds,
      });

      router.refresh();
      router.push(`/dashboard/entries/${entryId}`);
    } catch (err) {
      console.error('Failed to update entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Archived', label: 'Archived' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-white border border-zinc-200 rounded-xl animate-pulse">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/entries/${entryId}`}>
            <Button type="button" variant="ghost" size="sm" className="p-1.5 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-zinc-500 hover:text-zinc-800" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Edit Experiment Log</h1>
            <p className="text-xs text-zinc-500">Modify title, status, tags, and documentation notes.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/dashboard/entries/${entryId}`}>
            <Button type="button" variant="outline" className="cursor-pointer bg-white">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSaving} className="shadow-xs cursor-pointer">
            <Save className="h-4 w-4 mr-1.5" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Main Metadata Section */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Title */}
        <div className="md:col-span-2">
          <Input
            label="Experiment Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Status */}
        <div>
          <Select
            label="Status"
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>

        {/* Sample Name */}
        <div>
          <Input
            label="Sample Reference Name"
            type="text"
            placeholder="e.g. EA-BATCH-004"
            value={sampleName}
            onChange={(e) => setSampleName(e.target.value)}
            helperText="Reference or batch number if applicable"
          />
        </div>

        {/* Tags Selector */}
        <div className="md:col-span-2">
          <TagInput
            selectedTagIds={selectedTagIds}
            availableTags={availableTags}
            onTagToggle={handleTagToggle}
            onTagCreate={handleTagCreate}
          />
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-3">
        <span className="text-sm font-semibold text-zinc-750">Lab Notebook Editor</span>
        <RichTextEditor value={content} onChange={setContent} />
      </div>

      {/* Secondary Bottom Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Link href={`/dashboard/entries/${entryId}`}>
          <Button type="button" variant="outline" className="cursor-pointer bg-white">Cancel</Button>
        </Link>
        <Button type="submit" isLoading={isSaving} className="shadow-xs cursor-pointer">
          <Save className="h-4 w-4 mr-1.5" /> Save Changes
        </Button>
      </div>
    </form>
  );
}
