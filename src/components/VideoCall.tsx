'use client';

import React, { useState, useEffect } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  PhoneOff, 
  Volume2, 
  Maximize2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoCall() {
  const { 
    inCall, 
    micActive, 
    videoActive, 
    screenShareActive, 
    toggleMic, 
    toggleVideo, 
    toggleScreenShare,
    setInCall,
    participants
  } = useAuraStore();

  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!inCall) { setSeconds(0); return; }
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [inCall]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (!inCall) {
    return (
      <div className="h-64 rounded-2xl liquid-glass-card flex flex-col items-center justify-center gap-4 text-center p-6 border border-dashed border-white/10">
        <div>
          <h3 className="text-slate-200 font-medium">You left the call</h3>
          <p className="text-slate-400 text-xs mt-1">Rejoin to speak with the engineering team.</p>
        </div>
        <button
          onClick={() => setInCall(true)}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/20 transition-all duration-300"
        >
          Join Call
        </button>
      </div>
    );
  }

  // Sarah Jenkins (first participant)
  const sarah = participants.find(p => p.id === '1') || { name: 'Sarah Jenkins', avatar: '', status: 'Speaking...' };

  return (
    <section className="relative w-full h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group mb-6">
      {/* Sarah's Main Video Stream (Background) */}
      <div className="absolute inset-0 bg-slate-950">
        <img 
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800" 
          alt="Sarah Jenkins video feed" 
          className="w-full h-full object-cover opacity-85 saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* Participant Name Badge, Live Wave Indicator & Call Timer */}
      <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 z-20">
        <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse shadow-sm shadow-teal-400/80" />
        <span className="text-xs font-semibold text-white">{sarah.name}</span>
        
        {/* Glowing audio waveform indicator */}
        <div className="flex gap-[3px] items-end h-3 ml-1.5">
          <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-[2.5px] bg-teal-400 rounded-full" />
          <motion.div animate={{ height: [6, 14, 6] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-[2.5px] bg-teal-400 rounded-full" />
          <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.1 }} className="w-[2.5px] bg-teal-400 rounded-full" />
        </div>

        {/* Call Timer */}
        <span className="ml-2 text-xs font-mono text-slate-400 border-l border-white/10 pl-2">{formatTime(seconds)}</span>
      </div>

      {/* Floating Picture-in-Picture: You */}
      <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border border-white/15 shadow-2xl z-20 transition-all duration-300 bg-slate-900/90 backdrop-blur-md">
        {videoActive ? (
          <>
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300" 
              alt="Your video feed" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/80">
            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-2 shadow-inner">
              <span className="text-xs font-semibold text-slate-300">You</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Camera Off</span>
          </div>
        )}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/5">
          <span className="text-[10px] font-medium text-slate-200">You</span>
          {!micActive && <MicOff className="w-2.5 h-2.5 text-rose-500" />}
        </div>
      </div>

      {/* Video Overlay Info (when screen sharing) */}
      {screenShareActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-teal-950/20 backdrop-blur-[2px] border-2 border-teal-500/20 z-10">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-teal-500/30 flex items-center gap-3">
            <Monitor className="w-5 h-5 text-teal-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-200">Sharing your screen...</span>
          </div>
        </div>
      )}

      {/* Hover Panel controls: Fullscreen & volume toggles */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 text-slate-300 hover:text-white transition-all">
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 text-slate-300 hover:text-white transition-all">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Translucent Control Bar (Centered at Bottom) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/55 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 z-30 shadow-2xl shadow-black/80">
        
        {/* Toggle Microphone */}
        <button
          onClick={toggleMic}
          className={`p-3 rounded-xl transition-all duration-300 ${
            micActive 
              ? 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white' 
              : 'bg-rose-500/80 hover:bg-rose-600/90 text-white shadow-lg shadow-rose-500/20'
          }`}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Toggle Video/Camera */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-xl transition-all duration-300 ${
            videoActive 
              ? 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white' 
              : 'bg-rose-500/80 hover:bg-rose-600/90 text-white shadow-lg shadow-rose-500/20'
          }`}
          title={videoActive ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {videoActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        {/* Toggle Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-xl transition-all duration-300 ${
            screenShareActive 
              ? 'bg-teal-500/80 hover:bg-teal-600/90 text-white shadow-lg shadow-teal-500/20' 
              : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white'
          }`}
          title={screenShareActive ? 'Stop Sharing Screen' : 'Share Screen'}
        >
          <Monitor className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-white/10" />

        {/* Hang up call */}
        <button
          onClick={() => setInCall(false)}
          className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all duration-300 shadow-lg shadow-rose-600/30 hover:scale-105"
          title="Leave Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>

      </div>
    </section>
  );
}
