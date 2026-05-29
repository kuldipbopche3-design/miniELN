'use client';

// Prevent static prerendering of this auth-protected route at build time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useEntries } from '@/hooks/useEntries';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Plus, Filter, Calendar, Tag as TagIcon, RefreshCw, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function EntriesListPage() {
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();
  const { entries, isLoading, fetchEntries } = useEntries();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [selectedTagId, setSelectedTagId] = useState('All');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Available tags in workspace
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;

    // Fetch workspace tags
    const fetchTags = async () => {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .eq('workspace_id', activeWorkspace.id);
      if (data) setTags(data);
    };

    fetchTags();
  }, [activeWorkspace, supabase]);

  // Trigger fetch when activeWorkspace or sorting changes
  useEffect(() => {
    if (activeWorkspace) {
      fetchEntries({
        status,
        tagId: selectedTagId,
        search,
        sortBy,
        sortOrder
      });
    }
  }, [activeWorkspace, status, selectedTagId, sortBy, sortOrder, fetchEntries]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries({
      status,
      tagId: selectedTagId,
      search,
      sortBy,
      sortOrder
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('All');
    setSelectedTagId('All');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Archived', label: 'Archived' }
  ];

  const tagOptions = [
    { value: 'All', label: 'All Tags' },
    ...tags.map((t) => ({ value: t.id, label: t.name }))
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Modified' }
  ];

  const orderOptions = [
    { value: 'desc', label: 'Newest First' },
    { value: 'asc', label: 'Oldest First' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Experiment Logs</h1>
          <p className="text-sm text-zinc-500">Search, filter, and review lab notebook entries.</p>
        </div>
        <Link href="/dashboard/entries/new">
          <Button className="shadow-xs cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" /> Log Experiment
          </Button>
        </Link>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          
          {/* Search */}
          <div className="w-full md:flex-1 relative space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search titles, logs, or samples..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 h-10 w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Status */}
          <div className="w-full sm:w-44">
            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="w-full sm:w-44">
            <Select
              label="Tag"
              options={tagOptions}
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
            />
          </div>

          {/* Sort By */}
          <div className="w-full sm:w-44">
            <Select
              label="Sort By"
              options={sortOptions}
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
            />
          </div>

          {/* Order */}
          <div className="w-full sm:w-44">
            <Select
              label="Order"
              options={orderOptions}
              value={sortOrder}
              onChange={(e: any) => setSortOrder(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="submit" variant="secondary" className="flex-1 sm:flex-initial h-10 cursor-pointer">
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResetFilters}
              className="h-10 text-zinc-500 hover:text-zinc-700 cursor-pointer"
              title="Reset Filters"
            >
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* Entries List Render */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-white border border-zinc-200 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No results match filters"
          description="Try clearing your search query or switching your status/tag selections to find other logs."
          actionText="Clear all filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              className="flex flex-col bg-white border border-zinc-200 rounded-xl hover:shadow-md hover:border-zinc-300 transition duration-200 overflow-hidden group shadow-xs"
            >
              {/* Header Indicator */}
              <div className="p-5 flex-1 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <Badge
                    variant={
                      entry.status === 'Completed' ? 'accent' :
                      entry.status === 'In Progress' ? 'primary' :
                      entry.status === 'Draft' ? 'zinc' : 'warning'
                    }
                    styleType="subtle"
                  >
                    {entry.status}
                  </Badge>
                  <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </span>
                </div>

                <div className="space-y-1">
                  <Link 
                    href={`/dashboard/entries/${entry.id}`}
                    className="font-bold text-zinc-950 text-base leading-snug group-hover:text-primary group-hover:underline block line-clamp-2"
                  >
                    {entry.title}
                  </Link>
                  {entry.sample_name && (
                    <p className="text-xs text-zinc-500 font-medium">
                      Sample: <span className="text-zinc-800">{entry.sample_name}</span>
                    </p>
                  )}
                </div>

                {/* Tags preview */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {entry.tags.slice(0, 3).map((tag: any) => (
                      <Badge key={tag.id} variant={tag.color as any} styleType="outline" className="text-[10px]">
                        {tag.name}
                      </Badge>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="text-[10px] text-zinc-400 font-semibold self-center">+{entry.tags.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[150px]">
                  By {entry.author?.display_name || 'Staff Member'}
                </span>
                <Link href={`/dashboard/entries/${entry.id}`}>
                  <Button variant="outline" size="sm" className="text-xs h-7.5 cursor-pointer">
                    Open Record
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
