'use client';

import React from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import ChatSection from './ChatSection';
import { Phone, Video, Info } from 'lucide-react';

export default function DirectMessagesPanel() {
  const { activeDmUser, participants } = useAuraStore();
  
  // Extended contact list (same as RightSidebar)
  const otherMembers = [
    { id: '5', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', status: 'Idle' as const },
    { id: '6', name: 'Liam Gallagher', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', status: 'Muted' as const },
  ];
  const allContacts = [...participants, ...otherMembers];
  const user = allContacts.find(p => p.id === activeDmUser);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        Select a conversation to start messaging.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 z-10 relative">
      
      {/* Header specific to Direct Messages */}
      <header className="flex items-center justify-between gap-4 border-b border-white/5 pb-5 mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-12 h-12 rounded-full object-cover border border-white/10"
            />
            {/* Status Indicator */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B101F] ${
              user.status !== 'Idle' ? 'bg-teal-400' : 'bg-slate-500'
            }`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">{user.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.status !== 'Idle' ? 'Active now' : 'Offline'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="p-2.5 rounded-xl bg-black/40 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-xl bg-black/40 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-xl bg-black/40 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* The generic chat section which adapts to the 'direct' tab state via the store */}
      <ChatSection />
      
    </div>
  );
}
