'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuraStore, ChatMessage } from '@/store/useAuraStore';
import { Paperclip, Send, Smile, Plus, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function ChatSection({ dmTargetName }: { dmTargetName?: string }) {
  const { activeChannel, activeTab, activeDmUser, participants, activeWorkspace } = useAuraStore();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isImageOnly = false) => {
    const file = e.target.files?.[0];
    if (file && activeWorkspace && currentUser) {
      setUploading(true);
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const type = ['fig'].includes(ext) ? 'figma' : ['pdf','md','txt'].includes(ext) ? 'document' : ['png','jpg','jpeg','gif','webp'].includes(ext) ? 'image' : ['zip','rar','7z'].includes(ext) ? 'archive' : 'document';
        
        if (isImageOnly && type !== 'image') {
          alert('Please select an image file.');
          setUploading(false);
          return;
        }

        const icon_name = type === 'image' ? 'ImageIcon' : type === 'archive' ? 'FolderArchive' : 'FileText';
        const colorMap: Record<string, { color: string; bg: string }> = {
          figma: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
          document: { color: 'text-teal-400', bg: 'bg-teal-500/10' },
          image: { color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          archive: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
        };
        const style = colorMap[type] || colorMap.document;
        const sizeStr = file.size > 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${Math.round(file.size / 1000)} KB`;
        
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const filePath = `${activeWorkspace}/${Date.now()}_${safeName}`;
        
        const { error: uploadError } = await supabase.storage.from('workspace-files').upload(filePath, file);
        if (uploadError) throw uploadError;
        
        const newFile = {
          workspace_id: activeWorkspace,
          uploader_id: currentUser.id,
          name: file.name,
          type,
          size: sizeStr,
          icon_name,
          icon_color: style.color,
          bg_color: style.bg,
          file_path: filePath
        };
        
        const { error: dbError } = await supabase.from('files').insert([newFile]);
        if (dbError) throw dbError;
        
        // Log activity
        await supabase.from('activities').insert({
          workspace_id: activeWorkspace,
          user_id: currentUser.id,
          action: 'uploaded a file',
          target: file.name,
          icon_type: icon_name,
          icon_color: style.color
        });
        
        // Automatically send a chat message sharing the file
        const targetId = activeTab === 'direct'
          ? getDmChannelId(currentUser.id, activeDmUser)
          : activeChannel;
          
        await supabase.from('messages').insert({
          channel_id: targetId,
          sender_id: currentUser.id,
          content: `📎 Shared a file: ${file.name} (${sizeStr}). You can find and download it in the Files tab.`
        });
      } catch (err: any) {
        console.error('Error sharing file:', err);
        alert(`Failed to share file: ${err.message || err}`);
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    }
  };
  
  // Canonical DM channel ID: sort both user IDs so both sides always use the same key
  // e.g. dm_aaa_bbb — regardless of who opened the conversation first
  const getDmChannelId = (myId: string, otherId: string) =>
    `dm_${[myId, otherId].sort().join('_')}`;
  
  // During initial render currentUser isn't set yet; we'll recompute inside the effect
  const currentTargetId = activeTab === 'direct'
    ? (currentUser ? getDmChannelId(currentUser.id, activeDmUser) : null)
    : activeChannel;
  
  // Resolve DM target name for placeholder
  const resolvedDmTargetName = dmTargetName || (activeTab === 'direct' ? participants.find(p => p.id === activeDmUser)?.name : '');

  // Get current user and fetch messages
  useEffect(() => {
    let channelSub: any;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const myId = session.user.id;
      setCurrentUser(session.user);

      // Compute the canonical channel ID now that we have the current user's ID
      const targetId = activeTab === 'direct'
        ? getDmChannelId(myId, activeDmUser)
        : activeChannel;

      if (!targetId) return;

      // Fetch existing messages
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          channel_id,
          sender_id,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('channel_id', targetId)
        .order('created_at', { ascending: true });

      if (data) {
        const mapped: ChatMessage[] = data.map((m: any) => ({
          id: m.id,
          content: m.content,
          senderName: m.profiles?.full_name || 'Unknown User',
          avatar: m.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.profiles?.full_name || 'U')}&background=6366f1&color=fff`,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: m.sender_id === myId,
          channelId: m.channel_id
        }));
        setMessages(mapped);
      }

      // Subscribe to new messages for this channel
      channelSub = supabase
        .channel(`messages:${targetId}:${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${targetId}` },
          async (payload) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', payload.new.sender_id)
              .single();

            const newMsg: ChatMessage = {
              id: payload.new.id,
              content: payload.new.content,
              senderName: profile?.full_name || 'Unknown User',
              avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=6366f1&color=fff`,
              timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSelf: payload.new.sender_id === myId,
              channelId: payload.new.channel_id
            };
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channelSub) {
        supabase.removeChannel(channelSub);
      }
    };
  }, [activeTab, activeDmUser, activeChannel]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;
    
    const text = inputText.trim();
    setInputText('');

    // Compute canonical ID at send time too
    const targetId = activeTab === 'direct'
      ? getDmChannelId(currentUser.id, activeDmUser)
      : activeChannel;

    const { error } = await supabase.from('messages').insert({
      channel_id: targetId,
      sender_id: currentUser.id,
      content: text
    });
    
    if (error) {
      console.error('Error sending message:', error);
      setInputText(text); // restore on failure
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
      
      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 pr-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 items-end ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar (Left-aligned messages only) */}
                {!msg.isSelf && (
                  <img
                    src={msg.avatar}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                  />
                )}

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[70%] gap-1.5 ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name (only for others) */}
                  {!msg.isSelf && (
                    <span className="text-[11px] font-semibold tracking-wide text-slate-400/90 pl-1">
                      {msg.senderName}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                      msg.isSelf
                        ? 'bg-gradient-to-br from-purple-600/70 to-indigo-600/70 text-white rounded-br-none border border-purple-500/20'
                        : 'bg-black/35 text-slate-200 rounded-bl-none border border-white/5 backdrop-blur-md'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-500/80 px-1 font-mono tracking-tight">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Avatar (Right-aligned messages only) */}
                {msg.isSelf && (
                  <img
                    src={msg.avatar}
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form 
        onSubmit={handleSend}
        className="mt-2 flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-lg focus-within:border-teal-500/30 transition-all duration-300"
      >
        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => handleFileUpload(e, false)} 
          className="hidden" 
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={imageInputRef} 
          onChange={(e) => handleFileUpload(e, true)} 
          className="hidden" 
        />

        {/* Attachment menu */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5 disabled:opacity-50"
          title="Add Files"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5 disabled:opacity-50 hidden sm:block"
          title="Add Images"
        >
          <Image className="w-5 h-5" />
        </button>

        {/* TextInput */}
        <input
          type="text"
          disabled={uploading}
          placeholder={uploading ? "Uploading file..." : (activeTab === 'direct' ? `Message @${resolvedDmTargetName}...` : `Type a message in #${activeChannel}...`)}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        {/* Emoji Button */}
        <button
          type="button"
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5"
          title="Select Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <div className="w-[1px] h-5 bg-white/10" />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || !currentUser || uploading}
          className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 ${
            inputText.trim() && currentUser && !uploading
              ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 cursor-pointer'
              : 'bg-white/5 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
