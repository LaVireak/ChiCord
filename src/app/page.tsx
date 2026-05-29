'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MiddlePanel from '@/components/MiddlePanel';
import RightSidebar from '@/components/RightSidebar';
import WorkspaceSelector from '@/components/WorkspaceSelector';
import AuthPage from '@/components/AuthPage';
import { useAuraStore } from '@/store/useAuraStore';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const { isAuthenticated, setIsAuthenticated, activeWorkspace } = useAuraStore();

  useEffect(() => {
    setMounted(true);

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setAuthChecking(false);
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setIsAuthenticated]);

  if (!mounted || authChecking) {
    return (
      <div className="relative w-screen h-screen bg-slate-950 flex items-center justify-center" suppressHydrationWarning>
        <div className="mesh-bg" suppressHydrationWarning />
        <div className="z-10 text-white animate-pulse font-medium tracking-widest text-sm uppercase">Loading Aura...</div>
      </div>
    );
  }

  // If not authenticated, show Auth Portal
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // If no workspace is selected, show the Landing Portal
  if (!activeWorkspace) {
    return <WorkspaceSelector />;
  }

  return (
    <div className="relative w-screen h-screen flex overflow-hidden p-0 md:p-4 lg:p-6 bg-slate-950" suppressHydrationWarning>
      {/* Animated Mesh Gradient Background */}
      <div className="mesh-bg" suppressHydrationWarning />
      
      {/* Core Workspace Wrapper */}
      <div className="w-full h-full flex gap-4 md:gap-5 lg:gap-6 rounded-none md:rounded-3xl overflow-hidden backdrop-blur-3xl shadow-2xl relative" suppressHydrationWarning>
        {/* Background panel overlay overlaying the main mesh to add slight darkening and backdrop contrast */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />

        {/* 1. Left Sidebar Navigation */}
        <div className="hidden md:flex h-full">
          <Sidebar />
        </div>

        {/* 2. Middle Panel: Live Video Call & Chat Feed */}
        <MiddlePanel />

        {/* 3. Right Sidebar: In Call participant directory */}
        <div className="hidden lg:flex h-full">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
