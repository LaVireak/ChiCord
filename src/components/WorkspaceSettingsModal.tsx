'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Shield, Settings, UserMinus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuraStore } from '@/store/useAuraStore';

interface WorkspaceSettingsModalProps {
  workspaceId: string;
  onClose: () => void;
}

export default function WorkspaceSettingsModal({ workspaceId, onClose }: WorkspaceSettingsModalProps) {
  const { workspaces, setWorkspaces, setActiveWorkspace } = useAuraStore();
  const [workspace, setWorkspace] = useState(workspaces.find(w => w.id === workspaceId));
  const [name, setName] = useState(workspace?.name || '');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          id,
          role,
          user_id,
          joined_at,
          profile:profiles!user_id ( full_name, avatar_url )
        `)
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true });
        
      if (data) setMembers(data);
    };
    fetchMembers();
  }, [workspaceId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('workspaces').update({ name }).eq('id', workspaceId);
    if (!error) {
      setWorkspaces(workspaces.map(w => w.id === workspaceId ? { ...w, name } : w));
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to completely delete this workspace? This cannot be undone.");
    if (!confirmDelete) return;

    setLoading(true);
    await supabase.from('workspaces').delete().eq('id', workspaceId);
    setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
    setActiveWorkspace(null); // Return to selector
    setLoading(false);
    onClose();
  };

  const handleRemoveMember = async (memberId: string) => {
    const confirmRemove = window.confirm("Remove this member from the workspace?");
    if (!confirmRemove) return;
    
    await supabase.from('workspace_members').delete().eq('id', memberId);
    setMembers(members.filter(m => m.id !== memberId));
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    await supabase.from('workspace_members').update({ role: newRole }).eq('id', memberId);
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Workspace Settings</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">General</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Workspace Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || name === workspace?.name}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </form>
          </section>

          <div className="w-full h-px bg-white/5" />

          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center justify-between">
              Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img 
                      src={member.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.profile?.full_name)}&background=6366f1&color=fff`} 
                      alt={member.profile?.full_name}
                      className="w-10 h-10 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{member.profile?.full_name}</p>
                      <p className="text-xs text-slate-500">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      disabled={member.role === 'owner' && members.filter(m => m.role === 'owner').length === 1}
                      className="bg-black/40 border border-white/10 text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                    
                    {member.role !== 'owner' && (
                      <button onClick={() => handleRemoveMember(member.id)} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="w-full h-px bg-white/5" />

          <section>
            <h3 className="text-sm font-semibold text-rose-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" /> Danger Zone
            </h3>
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-200">Delete Workspace</h4>
                <p className="text-xs text-slate-400 mt-1">Permanently delete this workspace and all its data.</p>
              </div>
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}
