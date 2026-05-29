'use client';

import React, { useState } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { Layers, Rocket, Megaphone, ArrowRight, Plus, X, Folder, Hexagon, CircleDashed, LogOut, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const iconMap: Record<string, React.ElementType> = {
  Layers, Rocket, Megaphone, Folder, Hexagon, CircleDashed
};

const randomColors = [
  { color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' },
  { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
];
const randomIcons = ['Folder', 'Hexagon', 'CircleDashed'];

export default function WorkspaceSelector() {
  const { workspaces, setWorkspaces, setActiveWorkspace, addWorkspace, setIsAuthenticated } = useAuraStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (prof) {
          setProfile(prof);
        } else {
          // Profile doesn't exist yet (failed during signup due to RLS), create it now
          const fallbackName = session.user.user_metadata?.full_name || 'User';
          const newProf = {
            id: session.user.id,
            full_name: fallbackName,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=6366f1&color=fff`
          };
          await supabase.from('profiles').insert([newProf]);
          setProfile(newProf);
        }
      }

      // We only fetch workspaces where the user is a member (RLS handles this)
      const { data, error } = await supabase.from('workspaces').select('*').order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching workspaces:', error);
      } else if (data) {
        const mapped = data.map((ws: any) => ({
          id: ws.id,
          name: ws.name,
          team: ws.team,
          members: ws.members,
          active: ws.active,
          iconName: ws.icon_name,
          color: ws.color,
          bg: ws.bg,
          border: ws.border
        }));
        setWorkspaces(mapped);
      }
      // Fetch pending invites including workspace info
      const { data: invitesData } = await supabase.from('workspace_invites')
        .select(`
          id, 
          workspace_id,
          inviter_id,
          workspaces (name, team, icon_name, color, bg, border)
        `)
        .eq('status', 'pending');
      
      if (invitesData && invitesData.length > 0) {
        // Fetch inviter profiles separately (inviter_id FK points to auth.users not public.profiles)
        const inviterIds = [...new Set(invitesData.map((i: any) => i.inviter_id).filter(Boolean))];
        const { data: profilesData } = await supabase.from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', inviterIds);
        
        const profileMap: Record<string, any> = {};
        (profilesData || []).forEach((p: any) => { profileMap[p.id] = p; });
        
        const enriched = invitesData.map((invite: any) => ({
          ...invite,
          inviter: profileMap[invite.inviter_id] || null
        }));
        setInvites(enriched);
      }

      setLoadingWorkspaces(false);
    };
    
    fetchWorkspaces();

    // Subscribe to changes
    const inviteSub = supabase.channel('public:workspace_invites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_invites' }, () => {
        fetchWorkspaces();
      }).subscribe();
      
    const memberSub = supabase.channel('public:workspace_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members' }, () => {
        fetchWorkspaces();
      }).subscribe();

    return () => {
      supabase.removeChannel(inviteSub);
      supabase.removeChannel(memberSub);
    };
  }, [setWorkspaces]);

  const handleAcceptInvite = async (inviteId: string, workspaceId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Join workspace
    await supabase.from('workspace_members').insert([{
      workspace_id: workspaceId,
      user_id: session.user.id,
      role: 'member'
    }]);

    // Update invite status
    await supabase.from('workspace_invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId);
      
    // Log activity
    await supabase.from('activities').insert({
      workspace_id: workspaceId,
      user_id: session.user.id,
      action: 'joined the workspace',
      target: '',
      icon_type: 'UserPlus',
      icon_color: 'text-indigo-400'
    });

    // Refresh page or state
    setInvites(invites.filter(i => i.id !== inviteId));
    window.location.reload();
  };

  const handleDeclineInvite = async (inviteId: string) => {
    await supabase.from('workspace_invites')
      .update({ status: 'rejected' })
      .eq('id', inviteId);
    setInvites(invites.filter(i => i.id !== inviteId));
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const id = `${newWorkspaceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const randomStyle = randomColors[Math.floor(Math.random() * randomColors.length)];
      const randomIcon = randomIcons[Math.floor(Math.random() * randomIcons.length)];
      
      const newWorkspace = {
        id,
        name: newWorkspaceName,
        team: 'New Project Team',
        members: 1,
        active: 1,
        icon_name: randomIcon,
        color: randomStyle.color,
        bg: randomStyle.bg,
        border: randomStyle.border,
        owner_id: session.user.id
      };

      const { error } = await supabase.from('workspaces').insert([newWorkspace]);
      if (error) {
        console.error('Error creating workspace:', error.message || error.details || error.hint || error);
        alert(`Database error: ${error.message}. Did you run the schema_v3.sql script in Supabase?`);
        return;
      }

      // Add to workspace_members as owner
      await supabase.from('workspace_members').insert([{
        workspace_id: id,
        user_id: session.user.id,
        role: 'owner'
      }]);

      addWorkspace({
        ...newWorkspace,
        iconName: newWorkspace.icon_name
      });

      setNewWorkspaceName('');
      setShowCreateModal(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  return (
    <div className="w-full h-screen bg-slate-950 overflow-y-auto relative">
      <div className="mesh-bg fixed inset-0 pointer-events-none" />
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xl pointer-events-none" />
      
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Aura</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center border border-white/10">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-indigo-400" />
              )}
            </div>
            <span className="text-sm font-medium text-slate-200">{profile?.full_name?.split(' ')[0] || 'User'}</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-center p-6 py-24">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-teal-400 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-teal-500/20">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Engineer'}.
          </h1>
          <p className="text-slate-400 text-lg">Select a workspace to continue collaboration.</p>
        </motion.div>

        {loadingWorkspaces ? (
           <div className="text-slate-400 animate-pulse">Loading workspaces...</div>
        ) : (
        <div className="flex flex-col w-full max-w-6xl gap-8">
          
          {/* Pending Invites Section */}
          {invites.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Pending Invites ({invites.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {invites.map((invite) => {
                  const ws = invite.workspaces;
                  const inviter = invite.inviter;
                  const inviterAvatar = inviter?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inviter?.full_name || 'Unknown')}&background=6366f1&color=fff`;
                  return (
                    <motion.div
                      key={invite.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 liquid-glass flex flex-col gap-4 relative overflow-hidden"
                    >
                      {/* Glow accent */}
                      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

                      {/* Workspace info */}
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${ws?.bg || 'bg-white/5'} ${ws?.border || 'border-white/10'}`}>
                          <Layers className={`w-6 h-6 ${ws?.color || 'text-slate-400'}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-bold truncate">{ws?.name || 'Unknown Workspace'}</h3>
                          <p className="text-xs text-slate-400 truncate">{ws?.team || 'Team'}</p>
                        </div>
                      </div>

                      {/* Inviter info */}
                      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                        <img
                          src={inviterAvatar}
                          alt={inviter?.full_name || 'Unknown'}
                          className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <p className="text-xs text-slate-300">
                          <span className="font-semibold text-white">{inviter?.full_name || 'Someone'}</span>
                          {' '}<span className="text-slate-400">invited you to join</span>
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-auto">
                        <button
                          onClick={() => handleAcceptInvite(invite.id, invite.workspace_id)}
                          className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(invite.id)}
                          className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workspaces.length === 0 && (
               <div className="col-span-full text-center text-slate-500 py-10 border border-dashed border-white/10 rounded-3xl bg-black/20">
                  You are not part of any workspaces yet. Create one to get started!
               </div>
            )}
          
          {workspaces.map((ws, idx) => {
            const Icon = iconMap[ws.iconName] || Layers;
            return (
              <motion.button
                key={ws.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => setActiveWorkspace(ws.id)}
                className={`relative flex flex-col items-start p-8 rounded-3xl border border-white/5 bg-black/40 hover:bg-white/5 transition-all duration-300 text-left group overflow-hidden liquid-glass hover:-translate-y-1 hover:shadow-2xl hover:shadow-${ws.color.split('-')[1]}-500/10`}
              >
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${ws.bg} blur-2xl group-hover:opacity-100 opacity-50 transition-opacity`} />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border ${ws.bg} ${ws.border}`}>
                  <Icon className={`w-7 h-7 ${ws.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                    {ws.name}
                  </h2>
                  <p className="text-slate-400 text-sm mb-6">{ws.team}</p>
                </div>
                <div className="w-full flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      {ws.members} members
                    </span>
                  </div>
                  <div className={`p-2 rounded-full bg-white/5 group-hover:${ws.bg} transition-colors`}>
                    <ArrowRight className={`w-4 h-4 text-slate-400 group-hover:${ws.color}`} />
                  </div>
                </div>
              </motion.button>
            );
          })}

          {/* Create Workspace Card */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: workspaces.length * 0.1 }}
            onClick={() => setShowCreateModal(true)}
            className="relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-white/10 bg-black/20 hover:bg-white/5 hover:border-teal-500/50 transition-all duration-300 text-center group overflow-hidden liquid-glass hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-white/5 group-hover:bg-teal-500/20 transition-colors">
              <Plus className="w-7 h-7 text-slate-400 group-hover:text-teal-400 transition-colors" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
              Create Workspace
            </h2>
            <p className="text-slate-400 text-sm">
              Start a new team or project
            </p>
          </motion.button>
          </div>
        </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md liquid-glass p-8 rounded-3xl shadow-2xl relative border border-white/10 bg-slate-900/80"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-6 border border-teal-500/30">
                <Plus className="w-6 h-6 text-teal-400" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Create a new workspace</h3>
              <p className="text-sm text-slate-400 mb-8">Set up a dedicated hub for your team to communicate, share files, and collaborate.</p>
              
              <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Project Phoenix"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-base text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-900 text-sm font-bold rounded-xl transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Create Workspace
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
