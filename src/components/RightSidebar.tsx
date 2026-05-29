'use client';

import React from 'react';
import { useAuraStore, Participant } from '@/store/useAuraStore';
import { Mic, MicOff, Monitor, Radio, Users2, MessageSquare, FileText, Download, Share2, Link, File } from 'lucide-react';
import { mockFiles } from './FilesPanel';

export default function RightSidebar() {
  const { participants, inCall, activeTab, activeDmUser, setActiveDmUser, activeFileId } = useAuraStore();

  const otherMembers = [
    { id: '5', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', role: 'Product Manager', online: true },
    { id: '6', name: 'Liam Gallagher', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', role: 'DevOps Engineer', online: false },
  ];

  // If inCall is false, we filter out participants list or render an empty state
  const callList = inCall ? participants : [];

  // Combine participants (excluding self) and otherMembers for DM list
  const dmContacts = [
    ...participants.filter(p => !p.isSelf),
    ...otherMembers.map(m => ({ ...m, status: m.online ? 'Idle' : 'Offline' })) as any
  ];

  // Resolve active file for File Inspector
  const activeFile = activeFileId ? mockFiles.find(f => f.id === activeFileId) : null;

  return (
    <aside className="w-80 h-full liquid-glass flex flex-col justify-between p-6 shrink-0 relative overflow-hidden">
      {/* Ambient glow inside panel */}
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6 z-10 overflow-hidden h-full justify-start">
        
        {activeTab === 'files' ? (
          /* File Inspector View */
          <div className="flex flex-col h-full">
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>File Details</span>
            </h3>

            {activeFile ? (
              <div className="flex flex-col gap-6">
                <div className={`w-full aspect-square rounded-2xl flex items-center justify-center border border-white/5 ${activeFile.bg}`}>
                  <activeFile.icon className={`w-24 h-24 ${activeFile.color}`} />
                </div>
                
                <div>
                  <h2 className="text-lg font-bold text-white mb-1 break-words">{activeFile.name}</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{activeFile.type} • {activeFile.size}</p>
                </div>

                <div className="flex flex-col gap-3 py-4 border-y border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Uploaded by</span>
                    <span className="text-slate-200 font-medium">{activeFile.uploader}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Date modified</span>
                    <span className="text-slate-200 font-medium">{activeFile.date}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-teal-500/95 hover:bg-teal-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-500/20">
                    <Download className="w-4 h-4" /> Download File
                  </button>
                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-all border border-white/5">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-all border border-white/5">
                      <Link className="w-4 h-4" /> Copy Link
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
          /* Direct Messages Contact List View */
          <div className="flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Conversations</span>
            </h3>
            
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-4">
              {dmContacts.map((contact: any) => {
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
                        src={contact.avatar} 
                        alt={contact.name} 
                        className={`w-10 h-10 rounded-full object-cover border-2 ${isActiveDm ? 'border-indigo-400' : 'border-white/10'}`}
                      />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        contact.status !== 'Offline' ? 'bg-teal-400' : 'bg-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${isActiveDm ? 'text-white' : 'text-slate-200'}`}>
                        {contact.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {contact.role || (contact.status !== 'Offline' ? 'Active' : 'Offline')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* In Call View */
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
    
              {/* Participant List */}
              {callList.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1">
                  {callList.map((person) => {
                    const isSpeaking = person.status === 'Speaking...';
                    const isMuted = person.status === 'Muted';
                    const isScreenSharing = person.status === 'Screen shared';

                return (
                  <div 
                    key={person.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                      isSpeaking 
                        ? 'bg-teal-500/10 border-teal-500/20 shadow-md shadow-teal-500/5' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar with speaking ring indicator */}
                      <div className="relative">
                        <img 
                          src={person.avatar} 
                          alt={person.name} 
                          className={`w-9 h-9 rounded-full object-cover border-2 ${
                            isSpeaking ? 'border-teal-400' : 'border-white/10'
                          }`}
                        />
                        {isSpeaking && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 border border-slate-900"></span>
                          </span>
                        )}
                      </div>

                      {/* Info details */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">{person.name}</span>
                          {person.isSelf && (
                            <span className="text-[9px] bg-white/15 px-1.5 py-0.2 rounded text-slate-300 font-medium">You</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium ${
                          isSpeaking 
                            ? 'text-teal-400' 
                            : isMuted 
                              ? 'text-rose-400' 
                              : isScreenSharing 
                                ? 'text-indigo-400' 
                                : 'text-slate-400'
                        }`}>
                          {person.status}
                        </span>
                      </div>
                    </div>

                    {/* Status Icons */}
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

        {/* Other Members section */}
        <div className="border-t border-white/5 pt-6 flex-1 flex flex-col justify-start overflow-hidden">
          <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-4">Other Members</h4>
          <div className="flex flex-col gap-3 overflow-y-auto pr-1">
            {otherMembers.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      member.online ? 'bg-teal-400' : 'bg-slate-600'
                    }`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">{member.name}</h5>
                    <span className="text-[10px] text-slate-500">{member.role}</span>
                  </div>
                </div>
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
