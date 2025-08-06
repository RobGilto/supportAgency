import { create } from 'zustand';

export interface AppStore {
  // Application state
  isLoading: boolean;
  error: string | null;
  
  // Terminal state  
  isTerminalVisible: boolean;
  terminalHeight: number;
  
  // Navigation state
  currentRoute: string;
  sidebarCollapsed: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  setCurrentRoute: (route: string) => void;
  toggleSidebar: () => void;
  clearError: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  isLoading: false,
  error: null,
  isTerminalVisible: true,
  terminalHeight: 200,
  currentRoute: '/',
  sidebarCollapsed: false,
  
  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  toggleTerminal: () => set((state) => ({ isTerminalVisible: !state.isTerminalVisible })),
  setTerminalHeight: (height) => set({ terminalHeight: height }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  clearError: () => set({ error: null }),
}));