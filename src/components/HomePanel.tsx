'use client';

import React, { useEffect, useState } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { 
  Hash, 
  Calendar, 
  Clock, 
  FileText, 
  Video, 
  MessageSquare,
  ArrowRight,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getIconComponent } from './FilesPanel';

const formatRelativeTime = (createdAt: string, timeString?: string) => {
  if (timeString && timeString.trim()) return timeString;
  if (!createdAt) return '';
  
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function HomePanel() {
  const { setActiveTab, setActiveChannel, activeWorkspace } = useAuraStore();
  const [profile, setProfile] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time_string: '', type: 'call' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (pData) setProfile(pData);
      }
      
      if (activeWorkspace) {
        // Fetch channels (limit 6, then deduplicate by name for quick access)
        const { data: cData } = await supabase.from('channels').select('*').eq('workspace_id', activeWorkspace).limit(6);
        if (cData) {
          const seen = new Set<string>();
          const unique = cData.filter(c => {
            if (seen.has(c.name)) return false;
            seen.add(c.name);
            return true;
          }).slice(0, 3);
          setChannels(unique);
        }

        // Fetch events
        const { data: eData } = await supabase.from('events').select('*').eq('workspace_id', activeWorkspace).order('created_at', { ascending: false });
        if (eData) setEvents(eData);

        // Fetch activities
        const { data: aData } = await supabase.from('activities').select(`
          *,
          user:profiles!user_id(full_name)
        `).eq('workspace_id', activeWorkspace).order('created_at', { ascending: false });
        if (aData) setActivities(aData);
      }
    };
    
    fetchData();

    if (!activeWorkspace) return;

    const subChannels = supabase.channel(`public:channels:home:${activeWorkspace}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels', filter: `workspace_id=eq.${activeWorkspace}` }, () => {
        fetchData();
      }).subscribe();

    const subEvents = supabase.channel(`public:events:home:${activeWorkspace}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `workspace_id=eq.${activeWorkspace}` }, () => {
        fetchData();
      }).subscribe();
      
    const subActivities = supabase.channel(`public:activities:home:${activeWorkspace}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `workspace_id=eq.${activeWorkspace}` }, () => {
        fetchData();
      }).subscribe();

    return () => {
      supabase.removeChannel(subChannels);
      supabase.removeChannel(subEvents);
      supabase.removeChannel(subActivities);
    };
  }, [activeWorkspace]);

  const handleQuickChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setActiveTab('channels');
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'call': return Video;
      case 'chat': return MessageSquare;
      default: return Calendar;
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'call': return 'text-teal-400';
      case 'chat': return 'text-indigo-400';
      default: return 'text-slate-400';
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !newEvent.title.trim() || !newEvent.time_string.trim()) return;
    
    await supabase.from('events').insert({
      workspace_id: activeWorkspace,
      title: newEvent.title.trim(),
      time_string: newEvent.time_string.trim(),
      type: newEvent.type
    });
    
    setShowEventModal(false);
    setNewEvent({ title: '', time_string: '', type: 'call' });
  };

  return (
    <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar">
      <div className="space-y-8 mt-2">
        
        {/* Welcome Section */}
        <section className="relative overflow-hidden rounded-3xl liquid-glass p-8 border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold text-white tracking-wide mb-2"
              >
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Engineer'}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-slate-400 text-sm max-w-md leading-relaxed"
              >
                You have {events.length} upcoming meetings and unread messages across your active channels today.
              </motion.p>
            </div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              onClick={() => setActiveTab('calls')}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-500/95 hover:bg-teal-400 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-teal-500/20"
            >
              <Video className="w-4 h-4" />
              <span>Join Daily Standup</span>
            </motion.button>
          </div>
        </section>

        {/* Quick Access Channels */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
            <Hash className="w-3.5 h-3.5" /> Quick Access
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channels.length === 0 ? (
              <p className="text-slate-500 text-sm col-span-3">No channels available yet.</p>
            ) : channels.map((chan, idx) => (
              <motion.button
                key={chan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * idx }}
                onClick={() => handleQuickChannel(chan.id)}
                className="liquid-glass-card hover:bg-white/10 p-5 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 group text-left relative overflow-hidden"
              >
                <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 text-teal-400`}>
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1 group-hover:text-teal-300 transition-colors">
                    # {chan.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {chan.unread_count > 0 ? `${chan.unread_count} unread messages` : 'No new messages'}
                  </p>
                </div>
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-teal-400" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Upcoming Schedule */}
          <section className="liquid-glass-card rounded-3xl p-6 border border-white/5 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                <Calendar className="w-3.5 h-3.5" /> Upcoming Schedule
              </h3>
              <button 
                onClick={() => setShowEventModal(true)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 opacity-50">
                  <Calendar className="w-8 h-8" />
                  <p className="text-sm">No upcoming events.</p>
                </div>
              ) : events.map((event, idx) => {
                const Icon = getEventIcon(event.type);
                const color = getEventColor(event.type);
                return (
                  <div key={event.id} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-12 h-12 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="text-sm font-semibold text-slate-200">{event.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{event.time_string}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="liquid-glass-card rounded-3xl p-6 border border-white/5 flex flex-col min-h-[300px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 shrink-0">
              <Clock className="w-3.5 h-3.5" /> Recent Activity
            </h3>
            <div className="space-y-5 flex-1">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 opacity-50">
                  <Clock className="w-8 h-8" />
                  <p className="text-sm">No recent activity.</p>
                </div>
              ) : activities.map((log, idx) => {
                const Icon = getIconComponent(log.icon_type);
                return (
                  <div key={log.id} className="flex gap-4 relative">
                    {/* Vertical line connector */}
                    {idx !== activities.length - 1 && <div className="absolute top-10 bottom-[-20px] left-[15px] w-[1px] bg-white/10" />}
                    
                    <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center shrink-0 z-10">
                      <Icon className={`w-3.5 h-3.5 ${log.icon_color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-white">{log.user?.full_name || 'Someone'}</span> {log.action} <span className="font-medium text-teal-300">{log.target}</span>
                      </p>
                      <span className="text-xs text-slate-500 mt-0.5 block">{formatRelativeTime(log.created_at, log.time_string)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
      
      {/* Create Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#0f1423] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
                <h2 className="text-lg font-bold text-white tracking-wide">Schedule Event</h2>
                <button 
                  onClick={() => setShowEventModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Event Title</label>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g. Weekly Sync"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Time / Date</label>
                  <input
                    type="text"
                    required
                    value={newEvent.time_string}
                    onChange={(e) => setNewEvent({ ...newEvent, time_string: e.target.value })}
                    placeholder="e.g. Today, 2:00 PM"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  >
                    <option value="call">Video Call</option>
                    <option value="chat">Chat / Text</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                  >
                    Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
