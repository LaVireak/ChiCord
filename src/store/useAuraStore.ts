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
  channelId?: string;
}

export interface WorkspaceData {
  id: string;
  name: string;
  team: string;
  members: number;
  active: number;
  iconName: string;
  color: string;
  bg: string;
  border: string;
}

interface AuraState {
  isAuthenticated: boolean;
  activeWorkspace: string | null;
  workspaces: WorkspaceData[];
  activeTab: 'home' | 'direct' | 'channels' | 'files' | 'calls';
  activeChannel: string;
  activeDmUser: string;
  activeFileId: string | null;
  inCall: boolean;
  micActive: boolean;
  videoActive: boolean;
  screenShareActive: boolean;
  participants: Participant[];
  messages: ChatMessage[];
  onlineUsers: Set<string>;

  setIsAuthenticated: (status: boolean) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
  addWorkspace: (workspace: WorkspaceData) => void;
  setActiveTab: (tab: 'home' | 'direct' | 'channels' | 'files' | 'calls') => void;
  setActiveChannel: (channel: string) => void;
  setActiveDmUser: (userId: string) => void;
  setActiveFileId: (fileId: string | null) => void;
  toggleMic: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  setInCall: (inCall: boolean) => void;
  sendMessage: (content: string) => void;
  setWorkspaces: (workspaces: WorkspaceData[]) => void;
  setOnlineUsers: (users: Set<string>) => void;
}

export const useAuraStore = create<AuraState>((set) => ({
  isAuthenticated: false,
  activeWorkspace: null,
  workspaces: [],
  activeTab: 'home',
  activeChannel: '',
  onlineUsers: new Set<string>(),
  activeDmUser: '',
  activeFileId: null,
  inCall: false,
  micActive: true,
  videoActive: true,
  screenShareActive: false,
  participants: [],
  messages: [],

  setIsAuthenticated: (status) => set({ isAuthenticated: status }),
  setActiveWorkspace: (workspaceId) => set({ activeWorkspace: workspaceId }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  addWorkspace: (workspace) => set((state) => ({ workspaces: [...state.workspaces, workspace] })),
  setOnlineUsers: (users) => set({ onlineUsers: new Set(users) }),
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
  // sendMessage is a no-op: all messages are sent directly to Supabase in ChatSection
  sendMessage: () => {},
}));
