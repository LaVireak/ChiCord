'use client';

import React, { useState, useEffect } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { Mic, MicOff, Monitor, Radio, Users2, MessageSquare, FileText, Download, Share2, Link, File } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getIconComponent } from './FilesPanel';

interface ProfileMember {
  id: string;
  full_name: string;
  avatar_url: string;
  isOnline?: boolean;
  role?: string;
}

export default function RightSidebar() {
  const { inCall, activeTab, activeDmUser, setActiveDmUser, setActiveTab, activeFileId, activeWorkspace, onlineUsers, setOnlineUsers } = useAuraStore();
  const [members, setMembers] = useState<ProfileMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<any>(null);
  const [copyLabel, setCopyLabel] = useState('Copy Link');

  useEffect(() => {
    if (!activeWorkspace) return;
    
    const fetchMembers = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      if (uid) setCurrentUserId(uid);

      // Fetch from workspace_members joined with profiles
      const { data } = await supabase.from('workspace_members')
        .select(`
          user_id,
          role,
          profile:profiles!user_id(id, full_name, avatar_url)
        `)
        .eq('workspace_id', activeWorkspace);

      if (data) {
        const mapped = data.map((m: any) => ({
          id: m.profile.id,
          full_name: m.profile.full_name,
          avatar_url: m.profile.avatar_url,
          role: m.role
        }));
        setMembers(mapped);
      }
    };

    fetchMembers();

    const sub = supabase.channel(`public:workspace_members:${activeWorkspace}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${activeWorkspace}` }, () => {
        fetchMembers();
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeWorkspace]);

  // Presence Tracking — single subscription that writes to shared store
  useEffect(() => {
    if (!activeWorkspace || !currentUserId) return;

    // Create a uniquely named presence channel per session so Supabase
    // doesn't confuse it with any other component's channel.
    const room = supabase.channel(`presence:workspace:${activeWorkspace}`, {
      config: { presence: { key: currentUserId } }
    });

    const handleSync = () => {
      const state = room.presenceState<{ user_id: string }>();
      const online = new Set<string>();
      for (const key in state) {
        state[key].forEach((p) => {
          if (p.user_id) online.add(p.user_id);
        });
      }
      // IMPORTANT: always spread into a new Set so Zustand/React sees the change
      setOnlineUsers(new Set(online));
    };

    room
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleSync)
      .on('presence', { event: 'leave' }, handleSync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({ user_id: currentUserId });
        }
      });

    return () => { room.unsubscribe(); };
  }, [activeWorkspace, currentUserId]);

  // Fetch active file details
  useEffect(() => {
    if (!activeFileId) {
      setActiveFile(null);
      return;
    }
    const fetchFile = async () => {
      const { data } = await supabase.from('files').select(`
        *,
        uploader:profiles!uploader_id(full_name)
      `).eq('id', activeFileId).single();
      
      if (data) setActiveFile(data);
    };
    fetchFile();
  }, [activeFileId]);

  const handleDownloadFile = async () => {
    if (!activeFile?.file_path) {
      alert('This file has no stored path and cannot be downloaded.');
      return;
    }
    const { data } = await supabase.storage.from('workspace-files').createSignedUrl(activeFile.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleCopyLink = async () => {
    if (!activeFile?.file_path) return;
    const { data } = await supabase.storage.from('workspace-files').createSignedUrl(activeFile.file_path, 3600);
    if (data?.signedUrl) {
      await navigator.clipboard.writeText(data.signedUrl);
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy Link'), 2000);
    }
  };

  const self = members.find(m => m.id === currentUserId);
  const otherMembers = members.filter(m => m.id !== currentUserId);

  const callList = inCall ? [
    ...(self ? [{ id: self.id, name: self.full_name, avatar: self.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(self.full_name)}&background=14b8a6&color=fff`, status: 'Idle', isSelf: true }] : []),
    ...otherMembers.map((m) => ({
      id: m.id,
      name: m.full_name,
      avatar: m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=6366f1&color=fff`,
      status: 'Idle',
      isSelf: false
    }))
  ] : [];

  const dmContacts = otherMembers;

  const FileIcon = activeFile ? getIconComponent(activeFile.icon_name) : null;

  return (
    <aside className="w-80 h-full liquid-glass flex flex-col justify-between p-6 shrink-0 relative overflow-hidden">
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6 z-10 overflow-hidden h-full justify-start">

        {activeTab === 'files' ? (
          <div className="flex flex-col h-full">
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>File Details</span>
            </h3>
            {activeFile && FileIcon ? (
              <div className="flex flex-col gap-6">
                <div className={`w-full aspect-square rounded-2xl flex items-center justify-center border border-white/5 ${activeFile.bg_color}`}>
                  <FileIcon className={`w-24 h-24 ${activeFile.icon_color}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1 break-words">{activeFile.name}</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{activeFile.type} • {activeFile.size}</p>
                </div>
                <div className="flex flex-col gap-3 py-4 border-y border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Uploaded by</span>
                    <span className="text-slate-200 font-medium">{activeFile.uploader?.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Date modified</span>
                    <span className="text-slate-200 font-medium">{new Date(activeFile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={handleDownloadFile} className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500/95 hover:bg-teal-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-500/20">
                    <Download className="w-4 h-4" /> Download File
                  </button>
                  <div className="flex gap-3">
                    <button onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-all border border-white/5">
                      <Link className="w-4 h-4" /> {copyLabel}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-2xl p-6">
                <File className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm text-center">Select a file from the workspace to view its details.</p>
              </div>
            )}
          </div>

        ) : activeTab === 'direct' ? (
          <div className="flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Conversations</span>
            </h3>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-4 custom-scrollbar">
              {dmContacts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center mt-4">No other users yet.</p>
              ) : (
                dmContacts.map((contact) => {
                  const isActiveDm = activeDmUser === contact.id;
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setActiveDmUser(contact.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${
                        isActiveDm
                          ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={contact.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.full_name)}&background=6366f1&color=fff`}
                          alt={contact.full_name}
                          className={`w-10 h-10 rounded-full object-cover border-2 ${isActiveDm ? 'border-indigo-400' : 'border-white/10'}`}
                        />
                        {onlineUsers.has(contact.id) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 bg-teal-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold truncate ${isActiveDm ? 'text-white' : 'text-slate-200'}`}>
                          {contact.full_name}
                        </h4>
                        <p className="text-xs text-teal-400 truncate">{contact.role?.toUpperCase()}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>In Call</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400">
                  {callList.length} Active
                </span>
              </div>

              {callList.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                  {callList.map((person) => {
                    const isSpeaking = person.status === 'Speaking...';
                    const isMuted = person.status === 'Muted';
                    const isScreenSharing = person.status === 'Screen shared';
                    return (
                      <div
                        key={person.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                          isSpeaking ? 'bg-teal-500/10 border-teal-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={person.avatar} alt={person.name} className={`w-9 h-9 rounded-full object-cover border-2 ${isSpeaking ? 'border-teal-400' : 'border-white/10'}`} />
                            {isSpeaking && (
                              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 border border-slate-900"></span>
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white">{person.name}</span>
                              {person.isSelf && <span className="text-[9px] bg-white/15 px-1.5 rounded text-slate-300 font-medium">You</span>}
                            </div>
                            <span className={`text-[10px] font-medium ${isSpeaking ? 'text-teal-400' : isMuted ? 'text-rose-400' : isScreenSharing ? 'text-indigo-400' : 'text-slate-400'}`}>
                              {person.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          {isMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                          {isScreenSharing && <Monitor className="w-3.5 h-3.5 text-indigo-400" />}
                          {isSpeaking && <Mic className="w-3.5 h-3.5 text-teal-400 animate-bounce" style={{ animationDuration: '1.2s' }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-white/5 border border-white/5 rounded-xl">
                  <Users2 className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400">No active participants</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-6 flex-1 flex flex-col overflow-hidden">
              <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-4">
                Workspace Members ({members.length})
              </h4>
              <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
                {self && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <div className="relative">
                      <img
                        src={self.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(self.full_name)}&background=14b8a6&color=fff`}
                        alt={self.full_name}
                        className="w-8 h-8 rounded-full object-cover border border-teal-400/50"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-teal-400" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-200">{self.full_name}</h5>
                      <span className="text-[10px] text-teal-400">You • {self.role?.toUpperCase()}</span>
                    </div>
                  </div>
                )}

                {otherMembers.length === 0 && !self && (
                  <p className="text-xs text-slate-500 text-center mt-2">No members yet.</p>
                )}
                {otherMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group"
                    onClick={() => {
                      setActiveDmUser(member.id);
                      setActiveTab('direct');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=6366f1&color=fff`}
                          alt={member.full_name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                        {onlineUsers.has(member.id) && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-teal-400" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{member.full_name}</h5>
                        <span className="text-[10px] text-slate-500">{member.role?.toUpperCase()}</span>
                      </div>
                    </div>
                    <MessageSquare className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
