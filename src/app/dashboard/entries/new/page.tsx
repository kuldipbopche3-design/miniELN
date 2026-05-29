'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useEntries } from '@/hooks/useEntries';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TagInput, Tag } from '@/components/ui/TagInput';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewEntryPage() {
  const router = useRouter();
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();
  const { createEntry } = useEntries();

  // Form states
  const [title, setTitle] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [content, setContent] = useState('<p></p>');
  const [isSaving, setIsSaving] = useState(false);

  // Available tags state
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  // Fetch available tags in workspace
  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchTags = async () => {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .eq('workspace_id', activeWorkspace.id);
      if (data) setAvailableTags(data);
    };

    fetchTags();
  }, [activeWorkspace, supabase]);

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
      toast.error('Please enter a title for the experiment log');
      return;
    }

    setIsSaving(true);
    try {
      const entryData = await createEntry({
        title: title.trim(),
        content,
        sample_name: sampleName.trim() || undefined,
        status,
        tagIds: selectedTagIds,
      });

      if (entryData) {
        router.refresh();
        router.push(`/dashboard/entries/${entryData.id}`);
      }
    } catch (err) {
      console.error('Failed to save entry:', err);
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

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation and Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/entries">
            <Button type="button" variant="ghost" size="sm" className="p-1.5 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-zinc-500 hover:text-zinc-800" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">New Experiment Log</h1>
            <p className="text-xs text-zinc-500">Record a new scientific trial or sample observations.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/entries">
            <Button type="button" variant="outline" className="cursor-pointer bg-white">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSaving} className="shadow-xs cursor-pointer">
            <Save className="h-4 w-4 mr-1.5" /> Save Record
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
            placeholder="e.g. Synthesis of Ethyl Acetate via Fischer Esterification"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Status */}
        <div>
          <Select
            label="Initial Status"
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

      {/* Tiptap Editor Section */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-zinc-700">Lab Notebook Editor</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-semibold text-primary select-none animate-pulse">
            <Sparkles className="h-3 w-3" /> TipTap Enabled
          </div>
        </div>
        <RichTextEditor value={content} onChange={setContent} />
      </div>

      {/* Secondary Bottom buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Link href="/dashboard/entries">
          <Button type="button" variant="outline" className="cursor-pointer bg-white">Cancel</Button>
        </Link>
        <Button type="submit" isLoading={isSaving} className="shadow-xs cursor-pointer">
          <Save className="h-4 w-4 mr-1.5" /> Save Record
        </Button>
      </div>
    </form>
  );
}
