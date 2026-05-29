'use client';

import React, { useState } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { Layers, Rocket, Megaphone, ArrowRight, Plus, X, Folder, Hexagon, CircleDashed, LogOut, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// Map icon strings to actual React components
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

  React.useEffect(() => {
    const fetchWorkspaces = async () => {
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
      setLoadingWorkspaces(false);
    };
    fetchWorkspaces();
  }, [setWorkspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
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
        border: randomStyle.border
      };

      const { error } = await supabase.from('workspaces').insert([newWorkspace]);
      if (error) {
        console.error('Error creating workspace:', error);
        return;
      }

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
      {/* Animated Background Mesh - Fixed so it doesn't cut off when scrolling */}
      <div className="mesh-bg fixed inset-0 pointer-events-none" />
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xl pointer-events-none" />
      
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Aura</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-slate-200">Engineer</span>
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

      {/* Central content wrapper */}
      <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-center p-6 py-24">
        
        {/* Header */}
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
            Welcome back, Engineer.
          </h1>
          <p className="text-slate-400 text-lg">Select a workspace to continue collaboration.</p>
        </motion.div>

        {/* Workspace Grid */}
        {loadingWorkspaces ? (
           <div className="text-slate-400 animate-pulse">Loading workspaces...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
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
                {/* Ambient glow inside card */}
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
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(3, ws.members))].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      {ws.active > 0 ? `${ws.active} active` : `${ws.members} members`}
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
