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

export interface Channel {
  id: string;
  name: string;
}

export default function MiddlePanel() {
  const { activeTab, activeChannel, setActiveChannel, activeWorkspace, workspaces } = useAuraStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);

  useEffect(() => {
    if (!activeWorkspace) return;
    
    const fetchChannels = async () => {
      const { data } = await supabase.from('channels').select('*').eq('workspace_id', activeWorkspace);
      if (data && data.length > 0) {
        setChannels(data);
        if (!activeChannel || !data.find(c => c.id === activeChannel)) {
          setActiveChannel(data[0].id as any);
        }
      } else {
        // If no channels exist for this workspace, create default ones automatically
        const defaultChannels = [
          { id: 'general', workspace_id: activeWorkspace, name: 'general' },
          { id: 'ui-ux-design', workspace_id: activeWorkspace, name: 'ui-ux-design' },
          { id: 'prototyping', workspace_id: activeWorkspace, name: 'prototyping' }
        ];
        await supabase.from('channels').insert(defaultChannels);
        setChannels(defaultChannels);
        setActiveChannel('general');
      }
    };
    
    fetchChannels();
    
    const sub = supabase.channel(`public:channels:${activeWorkspace}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channels', filter: `workspace_id=eq.${activeWorkspace}` }, (payload) => {
        setChannels(prev => [...prev, payload.new as Channel]);
      }).subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [activeWorkspace]);

  return (
    <main className="flex-1 h-full liquid-glass flex flex-col p-6 overflow-hidden relative">
      {/* Background radial accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {activeTab === 'home' ? (
        <HomePanel />
      ) : activeTab === 'files' ? (
        <FilesPanel />
      ) : activeTab === 'direct' ? (
        <DirectMessagesPanel />
      ) : (
        <>
          {/* Header & Channels Pill Row */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5 z-10 shrink-0">
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">{currentWorkspace?.name || 'Workspace'}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{currentWorkspace?.team || 'Collaborative workspace'}</p>
            </div>
            
            {/* Channel Selection Pills */}
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
                    {/* Active channel dot */}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />
                    )}
                    <span className="z-10"># {chan.name}</span>
                  </button>
                );
              })}
            </div>
          </header>

          {/* Main middle panel grid structure */}
          <div className="flex-1 flex flex-col min-h-0 z-10">
            {/* Video Call Window */}
            {activeTab === 'calls' && <VideoCall />}

            {/* Chat Thread */}
            <ChatSection />
          </div>
        </>
      )}
    </main>
  );
}
