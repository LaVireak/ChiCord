'use client';

import React from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { 
  Hash, 
  Calendar, 
  Clock, 
  FileText, 
  Video, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePanel() {
  const { setActiveTab, setActiveChannel } = useAuraStore();

  const handleQuickChannel = (channelId: 'general' | 'ui-ux-design' | 'prototyping') => {
    setActiveChannel(channelId);
    setActiveTab('channels');
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
                Welcome back, Engineer
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-slate-400 text-sm max-w-md leading-relaxed"
              >
                You have 2 upcoming meetings and 5 unread messages across your active channels today.
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
            {[
              { id: 'ui-ux-design', name: 'UI/UX Design', unread: 3, color: 'text-teal-400' },
              { id: 'prototyping', name: 'Prototyping', unread: 0, color: 'text-indigo-400' },
              { id: 'general', name: 'General', unread: 2, color: 'text-purple-400' },
            ].map((chan, idx) => (
              <motion.button
                key={chan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * idx }}
                onClick={() => handleQuickChannel(chan.id as any)}
                className="liquid-glass-card hover:bg-white/10 p-5 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 group text-left relative overflow-hidden"
              >
                <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 ${chan.color}`}>
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1 group-hover:text-teal-300 transition-colors">
                    # {chan.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {chan.unread > 0 ? `${chan.unread} unread messages` : 'No new messages'}
                  </p>
                </div>
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-teal-400" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Two-Column Layout for Schedule & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Upcoming Schedule */}
          <section className="liquid-glass-card rounded-3xl p-6 border border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Upcoming Schedule
            </h3>
            <div className="space-y-4">
              {[
                { title: 'Daily Standup', time: '10:00 AM - 10:30 AM', type: 'call' },
                { title: 'Design Review: Landing Page', time: '1:00 PM - 2:00 PM', type: 'call' },
                { title: '1-on-1 with Sarah', time: '3:30 PM - 4:00 PM', type: 'chat' }
              ].map((event, idx) => (
                <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="w-12 h-12 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                    {event.type === 'call' ? <Video className="w-5 h-5 text-teal-400" /> : <MessageSquare className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-sm font-semibold text-slate-200">{event.title}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="liquid-glass-card rounded-3xl p-6 border border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Recent Activity
            </h3>
            <div className="space-y-5">
              {[
                { user: 'Sarah Jenkins', action: 'uploaded a new file', target: 'Homepage_V2.fig', time: '10 mins ago', icon: FileText, color: 'text-amber-400' },
                { user: 'Marcus Chen', action: 'mentioned you in', target: '#general', time: '1 hour ago', icon: MessageSquare, color: 'text-indigo-400' },
                { user: 'Aria Stark', action: 'started a call in', target: '#prototyping', time: '2 hours ago', icon: Video, color: 'text-teal-400' },
              ].map((log, idx) => {
                const Icon = log.icon;
                return (
                  <div key={idx} className="flex gap-4 relative">
                    {/* Vertical line connector */}
                    {idx !== 2 && <div className="absolute top-10 bottom-[-20px] left-[15px] w-[1px] bg-white/10" />}
                    
                    <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center shrink-0 z-10">
                      <Icon className={`w-3.5 h-3.5 ${log.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-white">{log.user}</span> {log.action} <span className="font-medium text-teal-300">{log.target}</span>
                      </p>
                      <span className="text-xs text-slate-500 mt-0.5 block">{log.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
