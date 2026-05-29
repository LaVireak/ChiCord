'use client';

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuraStore } from '@/store/useAuraStore';

export default function PresenceProvider() {
  const { activeWorkspace, setOnlineUsers } = useAuraStore();

  useEffect(() => {
    let heartbeatInterval: any = null;
    let presenceSub: any = null;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !activeWorkspace) return;
      const userId = session.user.id;

      // Mark online initially
      await supabase.from('presence').upsert({
        workspace_id: activeWorkspace,
        user_id: userId,
        is_online: true,
        last_seen: new Date().toISOString()
      }, { onConflict: ['workspace_id', 'user_id'] });

      // Heartbeat to keep last_seen updated
      heartbeatInterval = setInterval(async () => {
        try {
          await supabase.from('presence').upsert({
            workspace_id: activeWorkspace,
            user_id: userId,
            is_online: true,
            last_seen: new Date().toISOString()
          }, { onConflict: ['workspace_id', 'user_id'] });
        } catch (e) {
          // ignore
        }
      }, 25000); // 25s

      // Subscribe to presence changes for this workspace
      presenceSub = supabase
        .channel(`presence:${activeWorkspace}:${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'presence', filter: `workspace_id=eq.${activeWorkspace}` }, payload => {
          // Fetch current online users snapshot
          fetchOnlineUsers();
        })
        .subscribe();

      // initial fetch
      fetchOnlineUsers();

      // mark offline on unload
      const onUnload = async () => {
        try {
          await supabase.from('presence').upsert({
            workspace_id: activeWorkspace,
            user_id: userId,
            is_online: false,
            last_seen: new Date().toISOString()
          }, { onConflict: ['workspace_id', 'user_id'] });
        } catch (e) {
          // ignore
        }
      };

      window.addEventListener('beforeunload', onUnload);

      // cleanup handler reference
      (setup as any)._onUnload = onUnload;
    };

    const fetchOnlineUsers = async () => {
      if (!activeWorkspace) return;
      try {
        const { data } = await supabase.from('presence').select('user_id').eq('workspace_id', activeWorkspace).eq('is_online', true);
        const set = new Set<string>((data || []).map((r: any) => r.user_id));
        setOnlineUsers(set);
      } catch (e) {
        // ignore
      }
    };

    setup();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      try {
        if ((setup as any)._onUnload) {
          window.removeEventListener('beforeunload', (setup as any)._onUnload);
        }
      } catch (e) {}
    };
  }, [activeWorkspace, setOnlineUsers]);

  return null;
}
