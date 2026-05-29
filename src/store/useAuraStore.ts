import { create } from 'zustand';

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  status: 'Speaking...' | 'Screen shared' | 'Muted' | 'Idle';
  isSelf?: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  avatar: string;
  content: string;
  timestamp: string;
  isSelf: boolean;
  channelId?: string; // Links message to a channel or DM
}

export interface WorkspaceData {
  id: string;
  name: string;
  team: string;
  members: number;
  active: number;
  iconName: string; // Since we can't store React components in Zustand easily, we store the icon name
  color: string;
  bg: string;
  border: string;
}

interface AuraState {
  isAuthenticated: boolean;
  activeWorkspace: string | null;
  workspaces: WorkspaceData[];
  activeTab: 'home' | 'direct' | 'channels' | 'files' | 'calls';
  activeChannel: 'general' | 'ui-ux-design' | 'prototyping';
  activeDmUser: string;
  activeFileId: string | null;
  inCall: boolean;
  micActive: boolean;
  videoActive: boolean;
  screenShareActive: boolean;
  participants: Participant[];
  messages: ChatMessage[];
  
  setIsAuthenticated: (status: boolean) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
  addWorkspace: (workspace: WorkspaceData) => void;
  setActiveTab: (tab: 'home' | 'direct' | 'channels' | 'files' | 'calls') => void;
  setActiveChannel: (channel: 'general' | 'ui-ux-design' | 'prototyping') => void;
  setActiveDmUser: (userId: string) => void;
  setActiveFileId: (fileId: string | null) => void;
  toggleMic: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  setInCall: (inCall: boolean) => void;
  sendMessage: (content: string) => void;
  setWorkspaces: (workspaces: WorkspaceData[]) => void;
}

export const useAuraStore = create<AuraState>((set) => ({
  isAuthenticated: false,
  activeWorkspace: null,
  workspaces: [],
  activeTab: 'calls',
  activeChannel: 'ui-ux-design',
  activeDmUser: '3', // Marcus Chen
  activeFileId: null,
  inCall: true,
  micActive: true,
  videoActive: true,
  screenShareActive: false,
  participants: [
    { id: '1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', status: 'Speaking...' },
    { id: '2', name: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', status: 'Idle', isSelf: true },
    { id: '3', name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'Muted' },
    { id: '4', name: 'Aria Stark', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', status: 'Idle' },
  ],
  messages: [
    // #ui-ux-design channel
    { id: 'm1', senderName: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', content: 'Hey team, I\'ve updated the prototyping styles for the landing page. Let me know what you think.', timestamp: '10:42 AM', isSelf: false, channelId: 'ui-ux-design' },
    { id: 'm2', senderName: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', content: 'Looks awesome! The liquid glass borders are much cleaner now.', timestamp: '10:43 AM', isSelf: true, channelId: 'ui-ux-design' },
    { id: 'm3', senderName: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', content: 'Perfect, let\'s review it in the call.', timestamp: '10:44 AM', isSelf: false, channelId: 'ui-ux-design' },
    { id: 'm4', senderName: 'Aria Stark', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', content: 'The new color tokens are looking 🔥. Can we also standardise the border radius?', timestamp: '10:50 AM', isSelf: false, channelId: 'ui-ux-design' },
    { id: 'm5', senderName: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', content: 'Agreed — I\'ll add a radius scale to globals.css and share the PR tonight.', timestamp: '10:52 AM', isSelf: true, channelId: 'ui-ux-design' },

    // #general channel
    { id: 'g1', senderName: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', content: 'Good morning everyone 👋 Sprint planning is at 9 AM today, don\'t forget!', timestamp: '8:00 AM', isSelf: false, channelId: 'general' },
    { id: 'g2', senderName: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', content: 'On it! I\'ll have my updates ready.', timestamp: '8:05 AM', isSelf: false, channelId: 'general' },
    { id: 'g3', senderName: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', content: 'Morning! See you all there.', timestamp: '8:07 AM', isSelf: true, channelId: 'general' },
    { id: 'g4', senderName: 'Aria Stark', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', content: 'Quick heads up — staging deploy went live an hour ago. No issues so far 🚀', timestamp: '9:30 AM', isSelf: false, channelId: 'general' },
    { id: 'g5', senderName: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', content: 'Great work Aria! Let\'s keep an eye on error rates today.', timestamp: '9:32 AM', isSelf: false, channelId: 'general' },

    // #prototyping channel
    { id: 'p1', senderName: 'Aria Stark', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', content: 'Just pushed the interactive prototype to Figma. The new onboarding flow is ready for review.', timestamp: '2:10 PM', isSelf: false, channelId: 'prototyping' },
    { id: 'p2', senderName: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', content: 'The swipe gestures feel really smooth! Nice work.', timestamp: '2:14 PM', isSelf: false, channelId: 'prototyping' },
    { id: 'p3', senderName: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', content: 'Left some comments on the 3rd screen — the CTA button needs more contrast.', timestamp: '2:20 PM', isSelf: true, channelId: 'prototyping' },
    { id: 'p4', senderName: 'Aria Stark', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', content: 'Good catch! I\'ll update it now and ping you.', timestamp: '2:22 PM', isSelf: false, channelId: 'prototyping' },

    // DMs — Marcus Chen (id: '3')
    { id: 'dm1', senderName: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', content: 'Hey, did you get a chance to look at the new API endpoints?', timestamp: '9:15 AM', isSelf: false, channelId: 'dm_3' },
    { id: 'dm2', senderName: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', content: 'Yes! They look good, just reviewing the error handling now.', timestamp: '9:18 AM', isSelf: true, channelId: 'dm_3' },
    { id: 'dm3', senderName: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', content: 'Let me know if you need the Postman collection. I can share it.', timestamp: '9:20 AM', isSelf: false, channelId: 'dm_3' },

    // DMs — Sarah Jenkins (id: '1')
    { id: 'dm4', senderName: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', content: 'Hey! Can you review my latest Figma updates before the design sync?', timestamp: '11:00 AM', isSelf: false, channelId: 'dm_1' },
    { id: 'dm5', senderName: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', content: 'Of course! I\'ll take a look in 30 mins.', timestamp: '11:05 AM', isSelf: true, channelId: 'dm_1' },

    // DMs — Aria Stark (id: '4')
    { id: 'dm6', senderName: 'Aria Stark', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', content: 'The prototype link is live! Check it out when you have a sec 🎉', timestamp: '3:00 PM', isSelf: false, channelId: 'dm_4' },
    { id: 'dm7', senderName: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', content: 'This looks incredible! The animations are super smooth.', timestamp: '3:15 PM', isSelf: true, channelId: 'dm_4' },
  ],
  
  setIsAuthenticated: (status) => set({ isAuthenticated: status }),
  setActiveWorkspace: (workspaceId) => set({ activeWorkspace: workspaceId }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  addWorkspace: (workspace) => set((state) => ({ workspaces: [...state.workspaces, workspace] })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveChannel: (channel) => set({ activeChannel: channel }),
  setActiveDmUser: (userId) => set({ activeDmUser: userId }),
  setActiveFileId: (fileId) => set({ activeFileId: fileId }),
  toggleMic: () => set((state) => {
    const updated = !state.micActive;
    return {
      micActive: updated,
      participants: state.participants.map(p => 
        p.isSelf ? { ...p, status: updated ? 'Idle' : 'Muted' } : p
      )
    };
  }),
  toggleVideo: () => set((state) => ({ videoActive: !state.videoActive })),
  toggleScreenShare: () => set((state) => {
    const updated = !state.screenShareActive;
    return {
      screenShareActive: updated,
      participants: state.participants.map(p => 
        p.isSelf ? { ...p, status: updated ? 'Screen shared' : 'Idle' } : p
      )
    };
  }),
  setInCall: (inCall) => set({ inCall }),
  sendMessage: (content) => set((state) => {
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      senderName: 'You',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      // Target current channel or current DM depending on active tab
      channelId: state.activeTab === 'direct' ? `dm_${state.activeDmUser}` : state.activeChannel,
    };
    return {
      messages: [...state.messages, newMsg]
    };
  })
}));
