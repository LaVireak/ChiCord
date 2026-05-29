'use client';

import React, { useState, useEffect } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import VideoCall from './VideoCall';
import ChatSection from './ChatSection';
import HomePanel from './HomePanel';
import DirectMessagesPanel from './DirectMessagesPanel';
import FilesPanel from './FilesPanel';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Plus } from 'lucide-react';

export interface Channel {
  id: string;
  name: string;
}

export default function MiddlePanel() {
  const { activeTab, activeChannel, setActiveChannel, activeWorkspace, workspaces } = useAuraStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [role, setRole] = useState<string>('member');
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);

  useEffect(() => {
    if (!activeWorkspace) return;
    
    const fetchChannelsAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: roleData } = await supabase.from('workspace_members')
          .select('role')
          .eq('workspace_id', activeWorkspace)
          .eq('user_id', session.user.id)
          .single();
        if (roleData) setRole(roleData.role);
      }

      const { data } = await supabase.from('channels').select('*').eq('workspace_id', activeWorkspace);
      if (data && data.length > 0) {
        setChannels(data);
        if (!activeChannel || !data.find(c => c.id === activeChannel)) {
          setActiveChannel(data[0].id as any);
        }
      } else {
        // Automatically create defaults if no channels exist
        // Note: RLS will only allow this if user is owner/admin
        if (session) {
          const defaultChannels = [
            { id: `general-${Date.now()}`, workspace_id: activeWorkspace, name: 'general' }
          ];
          const { error } = await supabase.from('channels').insert(defaultChannels);
          if (!error) {
            setChannels(defaultChannels);
            setActiveChannel(defaultChannels[0].id);
            
            // Log activity
            await supabase.from('activities').insert({
              workspace_id: activeWorkspace,
              user_id: session.user.id,
              action: 'created channel',
              target: '#general',
              icon_type: 'Hash',
              icon_color: 'text-teal-400'
            });
          }
        }
      }
    };
    
    fetchChannelsAndRole();
    
    const channelSub = supabase.channel(`public:channels:${activeWorkspace}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels', filter: `workspace_id=eq.${activeWorkspace}` }, () => {
        fetchChannelsAndRole();
      }).subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [activeWorkspace, setActiveChannel]);

  const handleCreateChannel = async () => {
    const name = window.prompt("Enter new channel name:");
    if (!name || !name.trim()) return;
    
    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const { error } = await supabase.from('channels').insert([{
      id,
      workspace_id: activeWorkspace,
      name: name.trim().toLowerCase()
    }]);

    if (!error) {
      setActiveChannel(id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('activities').insert({
          workspace_id: activeWorkspace,
          user_id: session.user.id,
          action: 'created channel',
          target: `#${name.trim().toLowerCase()}`,
          icon_type: 'Hash',
          icon_color: 'text-teal-400'
        });
      }
    } else {
      alert("Failed to create channel. You might not have permission.");
    }
  };

  return (
    <main className="flex-1 min-w-0 h-full liquid-glass flex flex-col p-6 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {activeTab === 'home' ? (
        <HomePanel />
      ) : activeTab === 'files' ? (
        <FilesPanel />
      ) : activeTab === 'direct' ? (
        <DirectMessagesPanel />
      ) : (
        <>
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5 z-10 shrink-0">
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">{currentWorkspace?.name || 'Workspace'}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{currentWorkspace?.team || 'Collaborative workspace'}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex gap-2 bg-black/35 p-1 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
                {channels.map((chan) => {
                  const isActive = activeChannel === chan.id;
                  return (
                    <button
                      key={chan.id}
                      onClick={() => setActiveChannel(chan.id as any)}
                      className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 shrink-0 ${
                        isActive 
                          ? 'text-teal-400' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeChannelBg"
                          className="absolute inset-0 rounded-lg bg-teal-500/10 border border-teal-500/20"
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        />
                      )}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />
                      )}
                      <span className="z-10"># {chan.name}</span>
                    </button>
                  );
                })}
              </div>

              {(role === 'owner' || role === 'admin') && (
                <button 
                  onClick={handleCreateChannel}
                  className="p-1.5 rounded-xl bg-black/35 border border-white/5 text-slate-400 hover:text-white transition-colors ml-2"
                  title="Create Channel"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 flex flex-col min-h-0 z-10">
            {activeTab === 'calls' && <VideoCall />}
            <ChatSection />
          </div>
        </>
      )}
    </main>
  );
}
