'use client';

import React, { useState } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { 
  Home, 
  MessageSquare, 
  Hash, 
  Folder, 
  PhoneCall, 
  UserPlus, 
  HelpCircle, 
  Archive,
  Layers,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const { activeTab, setActiveTab, setActiveWorkspace, activeWorkspace, workspaces } = useAuraStore();
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);
  const workspaceName = currentWorkspace?.name ?? 'Workspace';
  const workspaceTeam = currentWorkspace?.team ?? '';
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'direct', label: 'Direct Messages', icon: MessageSquare },
    { id: 'channels', label: 'Channels', icon: Hash },
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'calls', label: 'Calls', icon: PhoneCall },
  ] as const;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setInvitedEmails([...invitedEmails, emailInput.trim()]);
      setEmailInput('');
    }
  };

  return (
    <>
      <aside className="w-72 h-full liquid-glass flex flex-col justify-between p-6 shrink-0 relative overflow-hidden">
        {/* Ambient Blur Inside Sidebar */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-8 z-10">
          {/* Global HQ Branding / Back to Workspaces */}
          <button 
            onClick={() => setActiveWorkspace(null)}
            className="flex items-center gap-3 text-left hover:bg-white/5 p-2 -m-2 rounded-xl transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-white uppercase group-hover:text-teal-300 transition-colors">{workspaceName}</h2>
              <p className="text-xs text-slate-400/80">{workspaceTeam}</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabGlow"
                      className="absolute inset-0 rounded-xl bg-teal-500/20 border border-teal-400/30 shadow-[0_0_15px_rgba(20,184,166,0.25)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  {/* Left Accent indicator line */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-teal-400"
                    />
                  )}

                  <Icon className={`w-5 h-5 z-10 transition-colors ${isActive ? 'text-teal-400' : 'group-hover:text-slate-200'}`} />
                  <span className="z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-6 z-10">
          {/* Invite Member Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-500/95 hover:bg-teal-400 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-[1px] active:translate-y-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>

          {/* Support / Archive links */}
          <div className="flex justify-between text-xs text-slate-500 px-1 border-t border-white/5 pt-4">
            <button className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Support</span>
            </button>
            <button className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md liquid-glass p-6 rounded-2xl shadow-2xl relative"
            >
              <button 
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-white mb-2">Invite to Engineering Team</h3>
              <p className="text-xs text-slate-400 mb-6">Send an email invitation to add collaborators to the workspace.</p>
              
              <form onSubmit={handleInvite} className="flex gap-2 mb-6">
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-400 transition-colors"
                >
                  Send
                </button>
              </form>

              {invitedEmails.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-2">Pending invites</h4>
                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {invitedEmails.map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="text-xs text-slate-300 font-mono">{email}</span>
                        <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">Sent</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
