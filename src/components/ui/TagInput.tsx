'use client';

import React from 'react';
import { Plus, X, Check, Search } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from '@/lib/utils';

export interface Tag {
  id: string;
  name: string;
  color: string; // e.g. 'indigo', 'emerald', 'amber', 'rose', 'blue', 'violet'
}

interface TagInputProps {
  selectedTagIds: string[];
  availableTags: Tag[];
  onTagToggle: (tagId: string) => void;
  onTagCreate?: (name: string, color: string) => Promise<void>;
  className?: string;
}

const PRESET_COLORS = [
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-100 border border-indigo-200 text-indigo-700' },
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-100 border border-emerald-200 text-emerald-700' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-100 border border-blue-200 text-blue-700' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-100 border border-amber-200 text-amber-700' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-100 border border-rose-200 text-rose-700' },
  { value: 'violet', label: 'Violet', bg: 'bg-violet-100 border border-violet-200 text-violet-700' },
];

export const TagInput: React.FC<TagInputProps> = ({
  selectedTagIds,
  availableTags,
  onTagToggle,
  onTagCreate,
  className,
}) => {
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedColor, setSelectedColor] = React.useState('indigo');
  const [isCreating, setIsCreating] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTags = availableTags.filter((tag) => selectedTagIds.includes(tag.id));

  const handleCreateTag = async () => {
    if (!search.trim() || !onTagCreate) return;
    setIsCreating(true);
    try {
      await onTagCreate(search.trim(), selectedColor);
      setSearch('');
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim() && filteredTags.length === 0) {
      e.preventDefault();
      handleCreateTag();
    }
  };

  return (
    <div className={cn('relative w-full space-y-2', className)} ref={dropdownRef}>
      <label className="block text-sm font-medium text-zinc-700">Tags</label>
      
      {/* Selected tags row */}
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-1.5 border border-zinc-200 bg-white rounded-lg items-center">
        {selectedTags.length === 0 && (
          <span className="text-zinc-400 text-xs pl-1">No tags selected</span>
        )}
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant={tag.color as any}
            className="flex items-center gap-1 cursor-pointer pr-1 hover:brightness-95 transition"
            onClick={() => onTagToggle(tag.id)}
          >
            {tag.name}
            <X className="h-3 w-3 hover:text-zinc-900" />
          </Badge>
        ))}
        
        {/* Toggle Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 text-xs transition font-medium border border-zinc-200 border-dashed cursor-pointer"
        >
          <Plus className="h-3 w-3" /> Add / Manage
        </button>
      </div>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-40 mt-1 rounded-xl bg-white border border-zinc-200 p-3 shadow-lg max-h-[300px] overflow-y-auto space-y-3 animate-in fade-in duration-100">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search or create a tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8 pr-3 py-1.5 text-xs w-full border border-zinc-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-zinc-900"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider pl-1">
              Select tag
            </p>
            <div className="max-h-[140px] overflow-y-auto space-y-0.5">
              {filteredTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onTagToggle(tag.id)}
                    className={cn(
                      'flex items-center w-full px-2 py-1.5 rounded-md text-xs text-zinc-700 hover:bg-zinc-50 transition cursor-pointer',
                      isSelected && 'bg-zinc-50 font-medium'
                    )}
                  >
                    <Badge variant={tag.color as any} styleType="subtle" className="mr-2">
                      {tag.name}
                    </Badge>
                    {isSelected && <Check className="ml-auto h-3 w-3 text-primary" />}
                  </button>
                );
              })}

              {filteredTags.length === 0 && search.trim() === '' && (
                <p className="text-zinc-500 text-xs text-center py-4">No tags created yet</p>
              )}
            </div>
          </div>

          {/* Create tag row if it does not match exactly */}
          {search.trim() && !availableTags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase()) && (
            <div className="border-t border-zinc-100 pt-2.5 space-y-2">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                New tag color
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer border transition-all duration-200',
                      color.bg,
                      selectedColor === color.value
                        ? 'ring-2 ring-primary ring-offset-1 border-primary scale-105'
                        : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md bg-zinc-900 text-white font-medium hover:bg-zinc-800 text-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Create Tag &ldquo;{search.trim()}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
