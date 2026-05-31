'use client';

// Prevent static prerendering of this auth-protected route at build time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { createClient } from '@/lib/supabase/client';
import { 
  FileText, 
  Users, 
  File, 
  Activity, 
  Plus, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';

const DonutChart = ({ approved, review, inProgress, draft }: any) => {
  const total = approved + review + inProgress + draft;
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-48">
        <svg width="120" height="120" viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f4f4f5" strokeWidth="10" />
        </svg>
        <span className="text-xs text-zinc-400 font-semibold mt-4">No entries logged yet</span>
      </div>
    );
  }

  const pApproved = (approved / total) * 100;
  const pReview = (review / total) * 100;
  const pInProgress = (inProgress / total) * 100;
  const pDraft = (draft / total) * 100;

  const circ = 2 * Math.PI * 35; // circ = ~219.9
  const strokeApp = (approved / total) * circ;
  const strokeRev = (review / total) * circ;
  const strokeInP = (inProgress / total) * circ;
  const strokeDrf = (draft / total) * circ;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 h-48">
      <div className="relative w-28 h-28 shrink-0">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f4f4f5" strokeWidth="10" />
          {approved > 0 && (
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray={`${strokeApp} ${circ}`}
              strokeDashoffset="0"
            />
          )}
          {review > 0 && (
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeDasharray={`${strokeRev} ${circ}`}
              strokeDashoffset={-strokeApp}
            />
          )}
          {inProgress > 0 && (
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#6366f1"
              strokeWidth="10"
              strokeDasharray={`${strokeInP} ${circ}`}
              strokeDashoffset={-(strokeApp + strokeRev)}
            />
          )}
          {draft > 0 && (
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#71717a"
              strokeWidth="10"
              strokeDasharray={`${strokeDrf} ${circ}`}
              strokeDashoffset={-(strokeApp + strokeRev + strokeInP)}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-zinc-900">{total}</span>
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Logs</span>
        </div>
      </div>

      <div className="space-y-1.5 text-[11px] font-semibold text-zinc-650 grid grid-cols-2 sm:grid-cols-1 gap-x-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Approved: {approved} ({pApproved.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <span>In Review: {review} ({pReview.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
          <span>In Progress: {inProgress} ({pInProgress.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zinc-500 shrink-0" />
          <span>Draft: {draft} ({pDraft.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ data }: any) => {
  const maxCount = Math.max(...data.map((d: any) => d.count), 5);
  
  return (
    <div className="flex flex-col justify-end h-48 p-4">
      <div className="flex-1 flex items-end justify-between gap-4 h-full border-b border-zinc-150 pb-1.5">
        {data.map((item: any, idx: number) => {
          const barHeightPercent = (item.count / maxCount) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-150 px-2 py-0.5 rounded bg-zinc-900 text-white text-[9px] font-bold shadow whitespace-nowrap z-10 pointer-events-none">
                {item.count} logs
              </div>
              <div 
                style={{ height: `${Math.max(barHeightPercent, 4)}%` }} 
                className="w-full max-w-[24px] bg-gradient-to-t from-indigo-650 to-indigo-500 rounded-t hover:from-indigo-600 hover:to-indigo-400 transition-all duration-300"
              />
              <span className="text-[9px] text-zinc-400 font-bold mt-1.5 select-none uppercase tracking-wider">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const supabase = createClient();
  const { activeWorkspace } = useWorkspace();

  const [stats, setStats] = useState({
    totalEntries: 0,
    activeEntries: 0,
    filesCount: 0,
    membersCount: 0
  });
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chart States
  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    review: 0,
    in_progress: 0,
    draft: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (!activeWorkspace) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const workspaceId = activeWorkspace.id;

        // 1. Fetch total entries count
        const { count: totalCount } = await supabase
          .from('lab_entries')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('is_deleted', false);

        // 2. Fetch active entries count (status 'in_progress')
        const { count: activeCount } = await supabase
          .from('lab_entries')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('status', 'in_progress')
          .eq('is_deleted', false);

        // 3. Fetch files count
        const { count: filesCount } = await supabase
          .from('files')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId);

        // 4. Fetch team members count
        const { count: membersCount } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId);

        setStats({
          totalEntries: totalCount || 0,
          activeEntries: activeCount || 0,
          filesCount: filesCount || 0,
          membersCount: membersCount || 0
        });

        // 5. Fetch all statuses and dates for charts
        const { data: chartData } = await supabase
          .from('lab_entries')
          .select('status, created_at')
          .eq('workspace_id', workspaceId)
          .eq('is_deleted', false);

        const counts = {
          approved: 0,
          review: 0,
          in_progress: 0,
          draft: 0
        };

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIdx = new Date().getMonth();
        const last5Months: any[] = [];
        for (let i = 4; i >= 0; i--) {
          const idx = (currentMonthIdx - i + 12) % 12;
          last5Months.push({
            name: months[idx],
            count: 0
          });
        }

        if (chartData) {
          chartData.forEach((row: any) => {
            if (row.status in counts) {
              counts[row.status as keyof typeof counts]++;
            }
            const date = new Date(row.created_at || new Date());
            const monthName = months[date.getMonth()];
            const match = last5Months.find(m => m.name === monthName);
            if (match) {
              match.count++;
            }
          });
        }

        setStatusCounts(counts);
        setMonthlyData(last5Months);

        // 5. Fetch recent entries (last 5)
        const { data: recent } = await supabase
          .from('lab_entries')
          .select(`
            *,
            author:profiles!lab_entries_author_id_fkey(display_name),
            entry_tags(tag:tags(*))
          `)
          .eq('workspace_id', workspaceId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recent) {
          const parsedRecent = recent.map((entry: any) => {
            const tags = (entry.entry_tags || [])
              .filter((et: any) => et.tag !== null)
              .map((et: any) => et.tag);
            return {
              ...entry,
              tags
            };
          });
          setRecentEntries(parsedRecent);
        }

      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeWorkspace, supabase]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loading grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-zinc-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl h-96 animate-pulse" />
      </div>
    );
  }

  const statItems = [
    { name: 'Total Notebook Logs', value: stats.totalEntries, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Active Experiments', value: stats.activeEntries, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Analytical Files', value: stats.filesCount, icon: File, color: 'text-sky-600', bg: 'bg-sky-50' },
    { name: 'Team Members', value: stats.membersCount, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Title greeting row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Lab Dashboard</h1>
          <p className="text-sm text-zinc-500">Welcome to your electronic lab notebook workspace.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/entries/new">
            <Button className="shadow-xs cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Log Experiment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <div key={item.name} className="flex items-center p-6 bg-white border border-zinc-200 rounded-xl shadow-xs transition hover:shadow-md">
            <div className={`p-3 rounded-lg ${item.bg} ${item.color} mr-4 shrink-0`}>
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{item.name}</p>
              <h4 className="text-2xl font-bold text-zinc-900 mt-1">{item.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-5 space-y-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">QA Document Pass Rates</h3>
            <p className="text-[11px] text-zinc-450">Ratio of signed/approved compliance records against active drafts.</p>
          </div>
          <div className="border-t border-zinc-100 pt-3">
            <DonutChart 
              approved={statusCounts.approved} 
              review={statusCounts.review} 
              inProgress={statusCounts.in_progress} 
              draft={statusCounts.draft} 
            />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs p-5 space-y-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Log Throughput Velocity</h3>
            <p className="text-[11px] text-zinc-450">Monthly volume of logged scientific protocols and analytical batches.</p>
          </div>
          <div className="border-t border-zinc-100 pt-3">
            <BarChart data={monthlyData} />
          </div>
        </div>
      </div>

      {/* Main Body grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Recent Notebook Logs (Takes 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-650" />
              <h2 className="text-base font-bold text-zinc-900">Recent Experiment Logs</h2>
            </div>
            <Link 
              href="/dashboard/entries" 
              className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary-dark hover:underline transition"
            >
              View all logs <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-100 flex-1">
            {recentEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <BookOpen className="h-10 w-10 text-zinc-300" />
                <p className="mt-4 text-sm font-semibold text-zinc-950">No experiments logged yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">Start creating and documenting your chemical trials, calculations, or synthesis observations.</p>
                <Link href="/dashboard/entries/new" className="mt-4">
                  <Button size="sm">Create first entry</Button>
                </Link>
              </div>
            ) : (
              recentEntries.map((entry) => (
                <div key={entry.id} className="p-5 hover:bg-zinc-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <Link 
                      href={`/dashboard/entries/${entry.id}`}
                      className="font-bold text-zinc-900 hover:text-primary hover:underline block text-sm sm:text-base truncate"
                    >
                      {entry.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-500">
                      <span>By {entry.author?.display_name || 'Staff Member'}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                      {entry.sample_name && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-zinc-700">Sample: {entry.sample_name}</span>
                        </>
                      )}
                    </div>
                    {/* Tags row */}
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.tags.map((tag: any) => (
                          <Badge key={tag.id} variant={tag.color as any} styleType="subtle">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
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
                    <Link href={`/dashboard/entries/${entry.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Open
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Quick Information / Tips (Takes 1 column) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-tr from-indigo-700 to-indigo-900 text-white p-6 rounded-xl shadow-xs space-y-4">
            <h3 className="text-base font-bold">Research Workspace Guide</h3>
            <p className="text-xs text-indigo-100 leading-relaxed">
              LabFlow ELN allows you to collaborate securely with other researchers. Keep in mind:
            </p>
            <ul className="space-y-2 text-xs text-indigo-150 pl-4 list-disc">
              <li>Logs are shared instantly with your workspace team.</li>
              <li>You can drag-and-drop or select PDF and analytical raw data files inside any entry page.</li>
              <li>Exporting logs as signed PDFs creates a sealed review record.</li>
            </ul>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">Lab Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/entries/new" className="block text-center p-3 rounded-lg bg-zinc-50 border border-zinc-150 hover:bg-zinc-100 transition">
                <Plus className="h-5 w-5 mx-auto text-primary" />
                <span className="text-[10px] font-bold text-zinc-700 block mt-1.5">New Log</span>
              </Link>
              <Link href="/dashboard/files" className="block text-center p-3 rounded-lg bg-zinc-50 border border-zinc-150 hover:bg-zinc-100 transition">
                <File className="h-5 w-5 mx-auto text-primary" />
                <span className="text-[10px] font-bold text-zinc-700 block mt-1.5">Files Library</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
