'use client';

// Prevent static prerendering of this auth-protected route at build time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { 
  Layers, 
  Search, 
  Loader2, 
  FlaskConical, 
  FileSpreadsheet, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function SamplesRegistryPage() {
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();

  const [samples, setSamples] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [purityFilter, setPurityFilter] = useState('All');

  const fetchRegistrySamples = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_entries')
        .select(`
          id,
          title,
          status,
          created_at,
          metadata,
          author:profiles(display_name, email)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract sample lot metadata objects
      const extractedSamples = (data || [])
        .filter((entry: any) => {
          const lot = entry.metadata?.sample_lot;
          return lot && (lot.material_name || lot.lot_id);
        })
        .map((entry: any) => {
          const lot = entry.metadata.sample_lot;
          return {
            entryId: entry.id,
            entryTitle: entry.title,
            entryStatus: entry.status,
            authorName: entry.author?.display_name || 'Lab Staff',
            loggedDate: entry.created_at,
            materialName: lot.material_name || 'N/A',
            lotId: lot.lot_id || 'N/A',
            casNumber: lot.cas_number || 'N/A',
            quantity: lot.quantity || 'N/A',
            yieldPercent: lot.yield_percent || 'N/A',
            purity: lot.purity || 'N/A',
          };
        });

      setSamples(extractedSamples);
    } catch (err: any) {
      console.error('Failed to load batch registry:', err);
      toast.error('Failed to load material batch registry');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, supabase]);

  useEffect(() => {
    fetchRegistrySamples();
  }, [fetchRegistrySamples]);

  // Filtering logic
  const filteredSamples = samples.filter((sample) => {
    const matchSearch = 
      sample.materialName.toLowerCase().includes(search.toLowerCase()) ||
      sample.lotId.toLowerCase().includes(search.toLowerCase()) ||
      sample.casNumber.toLowerCase().includes(search.toLowerCase());

    if (purityFilter === 'All') return matchSearch;
    
    // Parse numerical purity value (e.g. "99.2%" -> 99.2)
    const purityVal = parseFloat(sample.purity.replace(/[^0-9.]/g, ''));
    if (isNaN(purityVal)) return purityFilter === 'Low' && matchSearch; // Unspecified or low
    
    if (purityFilter === 'UltraHigh') return purityVal >= 99 && matchSearch;
    if (purityFilter === 'High') return purityVal >= 95 && matchSearch;
    if (purityFilter === 'Standard') return purityVal < 95 && matchSearch;

    return matchSearch;
  });

  const getPurityBadgeColor = (purityStr: string) => {
    const purityVal = parseFloat(purityStr.replace(/[^0-9.]/g, ''));
    if (isNaN(purityVal)) return 'zinc';
    if (purityVal >= 99) return 'accent'; // Ultra High Purity
    if (purityVal >= 95) return 'primary'; // High Purity
    return 'warning'; // Standard/Technical Grade
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Layers className="h-6.5 w-6.5 text-indigo-650" /> Batch & Material Registry
          </h1>
          <p className="text-sm text-zinc-500">Track raw chemical inputs, intermediates, products, and catalog yields.</p>
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:flex-1 relative space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Search Registry</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by material name, batch ID, or CAS code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 h-10 w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="w-full sm:w-56 space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Purity Level
          </label>
          <select
            value={purityFilter}
            onChange={(e) => setPurityFilter(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="All">All Purities</option>
            <option value="UltraHigh">Ultra High (&ge; 99%)</option>
            <option value="High">High Purity (&ge; 95%)</option>
            <option value="Standard">Standard / Tech Grade (&lt; 95%)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center bg-white border border-zinc-200 rounded-xl">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredSamples.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No batches registered"
          description="Either search queries do not match or no experiment logs have sample lot metadata entered yet."
        />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] uppercase font-bold text-zinc-450 tracking-wider">
                  <th className="px-5 py-3">Batch / Lot ID</th>
                  <th className="px-5 py-3">Material Name</th>
                  <th className="px-5 py-3">CAS Code</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Yield (%)</th>
                  <th className="px-5 py-3">Purity (%)</th>
                  <th className="px-5 py-3">Source experiment</th>
                  <th className="px-5 py-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs text-zinc-800">
                {filteredSamples.map((sample, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/40 transition">
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-zinc-900 tracking-tight">
                      {sample.lotId}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-semibold text-zinc-950">
                      {sample.materialName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 font-mono text-[10px] text-zinc-650">
                        {sample.casNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-zinc-650">
                      {sample.quantity}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-zinc-650">
                      {sample.yieldPercent}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge 
                        variant={getPurityBadgeColor(sample.purity)} 
                        styleType="subtle"
                        className="text-[10px]"
                      >
                        {sample.purity}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link 
                        href={`/dashboard/entries/${sample.entryId}`}
                        className="inline-flex items-center text-primary font-bold hover:underline"
                      >
                        {sample.entryTitle} <ChevronRight className="h-3.5 w-3.5 ml-0.5 shrink-0" />
                      </Link>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-[11px] text-zinc-400">
                      {format(new Date(sample.loggedDate), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
