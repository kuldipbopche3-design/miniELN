'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { useRouter, usePathname } from 'next/navigation';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'] & {
  profile: Profile | null;
};
type WorkspaceSettings = Database['public']['Tables']['workspace_settings']['Row'];

interface WorkspaceContextType {
  user: any | null;
  profile: Profile | null;
  activeWorkspace: Workspace | null;
  members: WorkspaceMember[];
  settings: WorkspaceSettings | null;
  allWorkspaces: (Workspace & { role: string })[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaceData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<(Workspace & { role: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaceData = async (userId: string, targetWorkspaceId?: string) => {
    try {
      // 1. Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) setProfile(profileData);

      // 2. Fetch all workspaces this user is member of
      const { data: membershipData, error: memError } = await supabase
        .from('workspace_members')
        .select('role, workspace:workspaces(*)')
        .eq('user_id', userId);

      if (memError) throw memError;

      if (!membershipData || membershipData.length === 0) {
        // No workspaces found, redirect to onboarding or let trigger do it
        setIsLoading(false);
        return;
      }

      const workspacesList = (membershipData as any[])
        .filter(m => m.workspace !== null)
        .map(m => ({
          ...(m.workspace as Workspace),
          role: m.role
        }));

      setAllWorkspaces(workspacesList);

      // 3. Determine active workspace ID
      let activeId = targetWorkspaceId || localStorage.getItem('active_workspace_id');
      const isValidActive = workspacesList.some(w => w.id === activeId);

      if (!activeId || !isValidActive) {
        activeId = workspacesList[0].id;
        localStorage.setItem('active_workspace_id', activeId);
      }

      const active = workspacesList.find(w => w.id === activeId) || workspacesList[0];
      setActiveWorkspace(active);

      // 4. Fetch details for active workspace
      // Get settings
      const { data: settingsData } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', active.id)
        .single();
      
      if (settingsData) {
        setSettings(settingsData);
      } else {
        // Fallback default settings
        setSettings({
          workspace_id: active.id,
          max_file_size_mb: 10,
          allowed_mime_types: ['image/*', 'application/pdf', 'text/*', '.csv', '.xlsx'],
          entry_statuses: ['Draft', 'In Progress', 'Completed', 'Archived'],
          timezone: 'UTC',
          logo_url: null,
          updated_at: new Date().toISOString()
        });
      }

      // Get workspace members joined with profiles
      const { data: membersData } = await supabase
        .from('workspace_members')
        .select('*, profile:profiles(*)')
        .eq('workspace_id', active.id);

      if (membersData) {
        setMembers(membersData as WorkspaceMember[]);
      }

    } catch (err: any) {
      console.error('Error fetching workspace context data:', err);
    }
  };

  const refreshWorkspaceData = async () => {
    if (user) {
      await fetchWorkspaceData(user.id, activeWorkspace?.id);
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    localStorage.setItem('active_workspace_id', workspaceId);
    setIsLoading(true);
    if (user) {
      fetchWorkspaceData(user.id, workspaceId).finally(() => setIsLoading(false));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('active_workspace_id');
    setUser(null);
    setProfile(null);
    setActiveWorkspace(null);
    setMembers([]);
    setSettings(null);
    setAllWorkspaces([]);
    router.push('/login');
  };

  useEffect(() => {
    let authSubscription: any = null;

    const initAuth = async () => {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await fetchWorkspaceData(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }

      // Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser(session.user);
            await fetchWorkspaceData(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
            setActiveWorkspace(null);
            setMembers([]);
            setSettings(null);
            setAllWorkspaces([]);
          }
          setIsLoading(false);
        }
      );
      authSubscription = subscription;
    };

    initAuth();

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        profile,
        activeWorkspace,
        members,
        settings,
        allWorkspaces,
        isLoading,
        switchWorkspace,
        refreshWorkspaceData,
        signOut,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
