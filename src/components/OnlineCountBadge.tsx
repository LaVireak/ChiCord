'use client';

import React from 'react';
import { useAuraStore } from '@/store/useAuraStore';

export default function OnlineCountBadge({ workspaceId }: { workspaceId: string }) {
  const onlineUsers = useAuraStore(state => state.onlineUsers);
  const count = onlineUsers ? onlineUsers.size : 0;
  return (
    <div className="text-[11px] bg-slate-800/50 px-2 py-0.5 rounded-full text-teal-300 font-semibold border border-teal-500/10">
      {count} online
    </div>
  );
}
