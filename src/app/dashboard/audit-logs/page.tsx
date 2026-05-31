'use client';

// Prevent static prerendering of this auth-protected route at build time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  ShieldCheck, 
  Search, 
  Loader2, 
  Terminal, 
  Globe, 
  Calendar,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();

  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      // Query activity_logs with profile joint lookup
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profile:profiles(id, display_name, email)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load compliance audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, supabase]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Expand / collapse details view
  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const userEmail = log.profile?.email || '';
    const userName = log.profile?.display_name || '';
    const matchSearch = 
      userEmail.toLowerCase().includes(search.toLowerCase()) || 
      userName.toLowerCase().includes(search.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(search.toLowerCase());

    if (actionFilter === 'All') return matchSearch;
    return matchSearch && log.action === actionFilter;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'sign_off':
        return <Badge variant="accent" styleType="solid">Signed & Approved</Badge>;
      case 'reject':
        return <Badge variant="danger" styleType="solid">Revision Rejected</Badge>;
      case 'submit_review':
        return <Badge variant="primary" styleType="solid">Submitted Review</Badge>;
      case 'create':
        return <Badge variant="zinc" styleType="solid">Created Record</Badge>;
      case 'update':
        return <Badge variant="warning" styleType="solid">Updated Record</Badge>;
      case 'delete':
        return <Badge variant="danger" styleType="subtle">Deleted Record</Badge>;
      case 'upload':
        return <Badge variant="primary" styleType="subtle">Uploaded File</Badge>;
      default:
        return <Badge variant="zinc" styleType="subtle">{action}</Badge>;
    }
  };

  const actionOptions = [
    { value: 'All', label: 'All Actions' },
    { value: 'sign_off', label: 'Sign & Approve' },
    { value: 'reject', label: 'Rejections' },
    { value: 'submit_review', label: 'Submit for Review' },
    { value: 'create', label: 'Creation' },
    { value: 'update', label: 'Edits/Updates' },
    { value: 'delete', label: 'Deletions' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6.5 w-6.5 text-indigo-650" /> Compliance Audit Trail
          </h1>
          <p className="text-sm text-zinc-500">CFR Part 11 electronic records, logs, and signature histories.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:flex-1 relative space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Search Actor or Action</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by researcher name, email, or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 h-10 w-full rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="w-full sm:w-56 space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700">Action Filter</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Content rendering */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center bg-white border border-zinc-200 rounded-xl">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={Terminal}
          title="No audit entries"
          description="No action sequences recorded matching these filter options."
        />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] uppercase font-bold text-zinc-450 tracking-wider">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity Type</th>
                  <th className="px-5 py-3 text-right">Transaction Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs text-zinc-800">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-zinc-50/40 transition">
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-zinc-550">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                              <User className="h-3 w-3 text-zinc-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900">{log.profile?.display_name || 'System Actor'}</p>
                              <p className="text-[10px] text-zinc-400">{log.profile?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-semibold capitalize text-zinc-500">
                          {log.entity_type || 'System'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-650 hover:text-indigo-800 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>Hide Metadata <ChevronUp className="h-3.5 w-3.5" /></>
                            ) : (
                              <>View Metadata <ChevronDown className="h-3.5 w-3.5" /></>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Collapsible Metadata Sub-row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-zinc-50/50 p-5 border-t border-b border-zinc-150">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px]">
                              
                              {/* Metadata JSON Pretty Print */}
                              <div className="md:col-span-2 space-y-1.5">
                                <span className="uppercase text-[9px] font-bold text-zinc-400 tracking-wider">Payload Metadata</span>
                                <pre className="p-3 bg-zinc-900 text-zinc-350 rounded-lg overflow-x-auto text-[10px] leading-relaxed max-h-[160px] border border-zinc-950 font-mono">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>

                              {/* CFR Network & Device Compliance Details */}
                              <div className="space-y-3">
                                <div>
                                  <span className="uppercase text-[9px] font-bold text-zinc-400 tracking-wider block">Network Parameters</span>
                                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-zinc-700">
                                    <Globe className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                                    <span>IP Address: {log.ip_address || '127.0.0.1'}</span>
                                  </div>
                                </div>

                                <div>
                                  <span className="uppercase text-[9px] font-bold text-zinc-400 tracking-wider block">Signature Token Details</span>
                                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5 truncate" title={log.id}>
                                    Tx ID: {log.id}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed mt-1.5 break-all max-h-[44px] overflow-y-auto" title={log.user_agent}>
                                    UA: {log.user_agent || 'Unknown Web Client'}
                                  </p>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
