'use client';

import React, { useState, useEffect } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { 
  Home, 
  MessageSquare, 
  Hash, 
  FolderOpen, 
  PhoneCall, 
  UserPlus, 
  LifeBuoy, 
  Archive,
  Layers,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';
import InviteMemberModal from './InviteMemberModal';

export default function Sidebar() {
  const { activeTab, setActiveTab, activeWorkspace, setActiveWorkspace, workspaces } = useAuraStore();
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);
  
  const [role, setRole] = useState<string>('member');
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (!activeWorkspace) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('workspace_members')
          .select('role')
          .eq('workspace_id', activeWorkspace)
          .eq('user_id', session.user.id)
          .single();
        if (data) setRole(data.role);
      }
    };
    fetchRole();
  }, [activeWorkspace]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'direct', icon: MessageSquare, label: 'Direct Messages' },
    { id: 'channels', icon: Hash, label: 'Channels' },
    { id: 'files', icon: FolderOpen, label: 'Files' },
    { id: 'calls', icon: PhoneCall, label: 'Calls' },
  ] as const;

  if (!currentWorkspace) return null;

  return (
    <>
      <aside className="w-64 h-full liquid-glass flex flex-col justify-between p-4 shrink-0 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-6 z-10 relative h-full">
          {/* Back Button */}
          <div className="px-2 pt-2">
            <button
              onClick={() => setActiveWorkspace(null)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspaces
            </button>
          </div>

          {/* Workspace Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-[120px]">{currentWorkspace.name}</h1>
                <p className="text-[10px] text-teal-400 font-semibold">{role.toUpperCase()}</p>
              </div>
            </div>
            
            {role === 'owner' && (
              <button 
                onClick={() => setShowSettings(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
                    isActive 
                      ? 'text-teal-400 font-semibold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {/* Hover/Active Background */}
                  {isActive ? (
                    <motion.div 
                      layoutId="activeNavBg"
                      className="absolute inset-0 bg-teal-500/10 border border-teal-500/20 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
                  )}

                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300 transition-colors'}`} />
                  <span className="relative z-10 text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="mt-auto flex flex-col gap-4">
            {(role === 'owner' || role === 'admin') && (
              <button 
                onClick={() => setShowInvite(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500/95 hover:bg-teal-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-500/20 active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Invite Member
              </button>
            )}

            <div className="flex items-center justify-between px-2 text-slate-500 text-xs">
              <button 
                onClick={() => alert("ChiCord Support: If you need help, please contact support@chicord.com or ask in the #general channel.")}
                className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
              >
                <LifeBuoy className="w-3.5 h-3.5" /> Support
              </button>
              <button 
                onClick={() => alert("Archive: No archived channels or files are currently stored in this workspace.")}
                className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {showSettings && activeWorkspace && <WorkspaceSettingsModal workspaceId={activeWorkspace} onClose={() => setShowSettings(false)} />}
        {showInvite && activeWorkspace && <InviteMemberModal workspaceId={activeWorkspace} onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </>
  );
}
