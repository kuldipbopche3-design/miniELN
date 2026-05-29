'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { 
  User, 
  Building, 
  Users, 
  Sliders, 
  UserPlus, 
  Trash2, 
  Save, 
  ShieldAlert,
  FolderClosed,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const supabase = createClient();
  const { 
    user, 
    profile, 
    activeWorkspace, 
    members, 
    settings, 
    refreshWorkspaceData 
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'team'>('profile');
  
  // 1. Profile form states
  const [displayName, setDisplayName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // 2. Workspace form states
  const [workspaceName, setWorkspaceName] = useState('');
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(10);
  const [allowedMimeTypes, setAllowedMimeTypes] = useState('');
  const [entryStatuses, setEntryStatuses] = useState('');
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false);

  // 3. Team form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'guest'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Initialize values
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name || '');
    }
    if (settings) {
      setMaxFileSizeMb(settings.max_file_size_mb || 10);
      setAllowedMimeTypes(settings.allowed_mime_types?.join(', ') || '');
      setEntryStatuses(settings.entry_statuses?.join(', ') || '');
    }
  }, [profile, activeWorkspace, settings]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
      await refreshWorkspaceData();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;

    setIsUpdatingWorkspace(true);
    try {
      // Update workspace name
      const { error: wsError } = await (supabase.from('workspaces') as any)
        .update({ name: workspaceName.trim(), updated_at: new Date().toISOString() })
        .eq('id', activeWorkspace.id);

      if (wsError) throw wsError;

      // Update workspace settings
      const mimeTypesArray = allowedMimeTypes
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '');
      const statusesArray = entryStatuses
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '');

      const { error: settingsError } = await (supabase.from('workspace_settings') as any)
        .update({
          max_file_size_mb: maxFileSizeMb,
          allowed_mime_types: mimeTypesArray,
          entry_statuses: statusesArray,
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', activeWorkspace.id);

      if (settingsError) throw settingsError;

      toast.success('Workspace configurations saved successfully!');
      await refreshWorkspaceData();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update workspace settings');
    } finally {
      setIsUpdatingWorkspace(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      // 1. Look up profile of target email
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single();

      if (profileError || !targetProfile) {
        toast.error(`No registered user found with email "${inviteEmail}". They must sign up to LabFlow first.`);
        return;
      }

      const targetUser = targetProfile as any;

      // 2. Check if already member
      const isAlreadyMember = members.some((m) => m.user_id === targetUser.id);
      if (isAlreadyMember) {
        toast.error('This user is already a member of your workspace.');
        return;
      }

      // 3. Insert membership linkage
      const { error: insertError } = await (supabase.from('workspace_members') as any)
        .insert({
          workspace_id: activeWorkspace.id,
          user_id: targetUser.id,
          role: inviteRole,
        });

      if (insertError) throw insertError;

      toast.success(`Successfully invited ${targetUser.display_name} to the workspace!`);
      setInviteEmail('');
      await refreshWorkspaceData();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to invite team member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!activeWorkspace || !memberToRemove) return;

    setIsRemovingMember(true);
    try {
      const { error } = await (supabase.from('workspace_members') as any)
        .delete()
        .eq('workspace_id', activeWorkspace.id)
        .eq('user_id', memberToRemove.user_id);

      if (error) throw error;
      toast.success('Team member removed from workspace');
      await refreshWorkspaceData();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to remove member');
    } finally {
      setIsRemovingMember(false);
      setMemberToRemove(null);
    }
  };

  // Find if current user is owner or admin of this workspace
  const currentUserMembership = members.find((m) => m.user_id === user?.id);
  const isPrivileged = currentUserMembership?.role === 'owner' || currentUserMembership?.role === 'admin';

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Lab Settings</h1>
        <p className="text-sm text-zinc-500">Configure profile settings, workspace constraints, and team authorizations.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <User className="h-4 w-4" /> My Profile
        </button>
        
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'workspace'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Building className="h-4 w-4" /> Workspace Settings
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'team'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Users className="h-4 w-4" /> Team Roster
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs max-w-2xl">
        
        {/* Tab 1: Profile Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5 border-b border-zinc-100 pb-2">
              <User className="h-4.5 w-4.5 text-primary" /> Profile Configurations
            </h3>
            
            <Input
              label="Work Email Address"
              type="email"
              value={user?.email || ''}
              disabled
              helperText="Email address cannot be changed."
            />

            <Input
              label="Display Name / Initials Name"
              type="text"
              placeholder="e.g. Dr. Sarah Jenkins"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <div className="flex justify-end pt-2 border-t border-zinc-100 mt-6">
              <Button type="submit" isLoading={isUpdatingProfile} className="cursor-pointer">
                <Save className="h-4 w-4 mr-1.5" /> Save Profile
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Workspace Settings */}
        {activeTab === 'workspace' && (
          <form onSubmit={handleUpdateWorkspace} className="space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Building className="h-4.5 w-4.5 text-primary" /> Workspace Configurations
              </h3>
              {!isPrivileged && (
                <Badge variant="warning" styleType="subtle" className="text-[9px]">
                  Read Only
                </Badge>
              )}
            </div>

            {!isPrivileged && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-650">
                <ShieldAlert className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>You do not have administrative permissions to change settings for this workspace. Only <strong>owners</strong> or <strong>admins</strong> can save edits.</span>
              </div>
            )}

            <Input
              label="Lab Workspace Name"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={!isPrivileged}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Max File Upload Size (MB)"
                type="number"
                value={maxFileSizeMb}
                onChange={(e) => setMaxFileSizeMb(parseInt(e.target.value) || 10)}
                disabled={!isPrivileged}
                min={1}
                max={50}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700">Timezone</label>
                <select
                  disabled={!isPrivileged}
                  className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
                >
                  <option value="UTC">UTC</option>
                  <option value="GMT">GMT</option>
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                </select>
              </div>
            </div>

            <Input
              label="Permitted File Extensions (Comma Separated)"
              type="text"
              value={allowedMimeTypes}
              onChange={(e) => setAllowedMimeTypes(e.target.value)}
              placeholder="e.g. image/*, application/pdf, .csv, .xlsx"
              disabled={!isPrivileged}
              helperText="Leave default file guidelines or customize workspace permissions."
            />

            <Input
              label="Allowed Entry Status Types (Comma Separated)"
              type="text"
              value={entryStatuses}
              onChange={(e) => setEntryStatuses(e.target.value)}
              placeholder="e.g. Draft, In Progress, Completed, Archived"
              disabled={!isPrivileged}
              helperText="Statuses displayed inside experiment composer dropdown lists."
            />

            {isPrivileged && (
              <div className="flex justify-end pt-2 border-t border-zinc-100 mt-6">
                <Button type="submit" isLoading={isUpdatingWorkspace} className="cursor-pointer">
                  <Save className="h-4 w-4 mr-1.5" /> Save Workspace
                </Button>
              </div>
            )}
          </form>
        )}

        {/* Tab 3: Team Roster Settings */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            
            {/* Invite Form (Privileged Only) */}
            {isPrivileged ? (
              <form onSubmit={handleInviteMember} className="space-y-4 p-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-primary" /> Invite Researcher
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <Input
                      label="User Email Address"
                      type="email"
                      placeholder="colleague@lab.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Select
                      label="Assigned Role"
                      options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'member', label: 'Member' },
                        { value: 'guest', label: 'Guest' }
                      ]}
                      value={inviteRole}
                      onChange={(e: any) => setInviteRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" size="sm" isLoading={isInviting} className="cursor-pointer">
                    Invite Member
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-650">
                <ShieldAlert className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>Only <strong>owners</strong> or <strong>admins</strong> can invite or manage lab team authorizations.</span>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Team ({members.length})</h4>
              
              <div className="divide-y divide-zinc-150 border border-zinc-150 rounded-xl overflow-hidden bg-white">
                {members.map((member) => {
                  const isSelf = member.user_id === user?.id;
                  const displayName = member.profile?.display_name || 'Lab Researcher';
                  const email = member.profile?.email || 'N/A';

                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={displayName} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-950 text-xs truncate">{displayName}</span>
                            {isSelf && (
                              <Badge variant="zinc" styleType="solid" className="text-[9px] py-0 px-1.5">You</Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block truncate">{email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={
                            member.role === 'owner' ? 'danger' :
                            member.role === 'admin' ? 'warning' :
                            member.role === 'member' ? 'primary' : 'zinc'
                          } 
                          styleType="subtle"
                          className="capitalize text-[10px]"
                        >
                          {member.role}
                        </Badge>

                        {/* Remove Action */}
                        {isPrivileged && !isSelf && member.role !== 'owner' && (
                          <button
                            onClick={() => setMemberToRemove(member)}
                            className="p-1 rounded-md hover:bg-rose-50 text-zinc-400 hover:text-rose-650 transition cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={memberToRemove !== null}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${memberToRemove?.profile?.display_name || 'this researcher'} from this workspace? They will lose all access to workspace notebooks and uploaded files.`}
        confirmText="Remove Access"
        isDestructive
        isLoading={isRemovingMember}
      />

    </div>
  );
}
