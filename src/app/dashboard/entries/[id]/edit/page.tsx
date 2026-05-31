'use client';

// Prevent static prerendering of this auth-protected route at build time.
export const dynamic = 'force-dynamic';

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
  const [status, setStatus] = useState('in_progress');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [content, setContent] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Sample Lot metadata states
  const [materialName, setMaterialName] = useState('');
  const [lotId, setLotId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [yieldPercent, setYieldPercent] = useState('');
  const [casNumber, setCasNumber] = useState('');
  const [purity, setPurity] = useState('');

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

      const sampleLot = entryData.metadata?.sample_lot || {};
      setMaterialName(sampleLot.material_name || '');
      setLotId(sampleLot.lot_id || '');
      setQuantity(sampleLot.quantity || '');
      setYieldPercent(sampleLot.yield_percent || '');
      setCasNumber(sampleLot.cas_number || '');
      setPurity(sampleLot.purity || '');
      
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
      const sampleLotData = {
        material_name: materialName.trim(),
        lot_id: lotId.trim(),
        quantity: quantity.trim(),
        yield_percent: yieldPercent.trim(),
        cas_number: casNumber.trim(),
        purity: purity.trim(),
      };

      await updateEntry(entryId, {
        title: title.trim(),
        content,
        sample_name: sampleName.trim() || undefined,
        status,
        tagIds: selectedTagIds,
        metadata: { sample_lot: sampleLotData }
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
    { value: 'draft', label: 'Draft' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'approved', label: 'Approved' },
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

      {/* Sample Lot Registry Panel */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Sample / Batch Information (Optional)</h3>
          <p className="text-[11px] text-zinc-400">Log chemical batch metadata to index it inside the workspace-wide Registry.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Input
            label="Material Name"
            type="text"
            placeholder="e.g. Aspirin (Acetylsalicylic Acid)"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
          />
          <Input
            label="Lot / Batch ID"
            type="text"
            placeholder="e.g. ASP-2026-05"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
          />
          <Input
            label="CAS Number"
            type="text"
            placeholder="e.g. 50-78-2"
            value={casNumber}
            onChange={(e) => setCasNumber(e.target.value)}
          />
          <Input
            label="Quantity"
            type="text"
            placeholder="e.g. 25.4 g"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Input
            label="Yield Percentage (%)"
            type="text"
            placeholder="e.g. 88.5%"
            value={yieldPercent}
            onChange={(e) => setYieldPercent(e.target.value)}
          />
          <Input
            label="Purity (%)"
            type="text"
            placeholder="e.g. 99.2%"
            value={purity}
            onChange={(e) => setPurity(e.target.value)}
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
