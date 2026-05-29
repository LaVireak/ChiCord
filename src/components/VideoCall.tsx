'use client';

import React, { useState } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

export default function VideoCall() {
  const { inCall, setInCall, activeWorkspace } = useAuraStore();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      const username = prof?.full_name || 'User';

      const res = await fetch(`/api/livekit?room=${activeWorkspace}&username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setToken(data.token);
      setInCall(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    setInCall(false);
    setToken('');
  };

  if (!inCall || !token) {
    return (
      <div className="h-64 rounded-2xl liquid-glass-card flex flex-col items-center justify-center gap-4 text-center p-6 border border-dashed border-white/10 mb-6">
        <div>
          <h3 className="text-slate-200 font-medium">Workspace Voice & Video</h3>
          <p className="text-slate-400 text-xs mt-1">Join the huddle to stream with your team.</p>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all duration-300"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Join Call
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6 bg-slate-950 flex flex-col">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
        onDisconnected={handleLeave}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          /* Force the inner container to be relative for absolute positioning */
          .lk-video-conference-inner {
            position: relative !important;
          }
          /* Make the chat panel float over the video grid on the right */
          .lk-chat {
            position: absolute !important;
            right: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            height: 100% !important;
            z-index: 50 !important;
            width: 320px !important;
            background-color: rgba(2, 6, 23, 0.95) !important;
            backdrop-filter: blur(16px) !important;
            border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5) !important;
          }
        `}} />
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
