'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InviteMemberModalProps {
  workspaceId: string;
  onClose: () => void;
}

export default function InviteMemberModal({ workspaceId, onClose }: InviteMemberModalProps) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    // Basic search of all platform users that aren't already in this workspace
    const fetchUsers = async () => {
      // First get current members to exclude them
      const { data: members } = await supabase.from('workspace_members').select('user_id').eq('workspace_id', workspaceId);
      const memberIds = members?.map(m => m.user_id) || [];

      // Fetch profiles
      let query = supabase.from('profiles').select('id, full_name, avatar_url');
      if (search) {
        query = query.ilike('full_name', `%${search}%`);
      }
      
      const { data } = await query.limit(10);
      if (data) {
        setUsers(data.filter(u => !memberIds.includes(u.id)));
      }
    };
    
    const timeoutId = setTimeout(fetchUsers, 300); // debounce
    return () => clearTimeout(timeoutId);
  }, [search, workspaceId]);

  const handleInvite = async (userId: string) => {
    setLoadingId(userId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Insert into workspace_invites
    const { error } = await supabase.from('workspace_invites').insert([{
      workspace_id: workspaceId,
      inviter_id: session.user.id,
      invitee_id: userId,
      status: 'pending'
    }]);
    
    if (error) {
      console.error('Error inviting:', error);
      alert('Could not send invite. You may have already invited them.');
    } else {
      setUsers(users.filter(u => u.id !== userId));
    }
    setLoadingId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Invite Member</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {users.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No users found.</p>
            ) : (
              users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=6366f1&color=fff`}
                      alt={user.full_name}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                    <span className="text-sm font-medium text-slate-200">{user.full_name}</span>
                  </div>
                  <button
                    onClick={() => handleInvite(user.id)}
                    disabled={loadingId === user.id}
                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {loadingId === user.id ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
