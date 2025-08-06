import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';

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
  
  // Theme state
  theme: 'light' | 'dark' | 'auto';
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  setCurrentRoute: (route: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  clearError: () => void;
  
  // Settings sync
  syncWithSettings: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  isLoading: false,
  error: null,
  isTerminalVisible: true,
  terminalHeight: 200,
  currentRoute: '/',
  sidebarCollapsed: false,
  theme: 'auto',
  
  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  toggleTerminal: async () => {
    const newValue = !get().isTerminalVisible;
    set({ isTerminalVisible: newValue });
    // Sync with settings
    try {
      await useSettingsStore.getState().updateSetting('terminalVisible', newValue);
    } catch (error) {
      console.warn('Failed to sync terminal visibility setting:', error);
    }
  },
  
  setTerminalHeight: async (height) => {
    set({ terminalHeight: height });
    // Sync with settings
    try {
      await useSettingsStore.getState().updateSetting('terminalHeight', height);
    } catch (error) {
      console.warn('Failed to sync terminal height setting:', error);
    }
  },
  
  setCurrentRoute: (route) => set({ currentRoute: route }),
  
  toggleSidebar: async () => {
    const newValue = !get().sidebarCollapsed;
    set({ sidebarCollapsed: newValue });
    // Sync with settings
    try {
      await useSettingsStore.getState().updateSetting('sidebarCollapsed', newValue);
    } catch (error) {
      console.warn('Failed to sync sidebar setting:', error);
    }
  },
  
  setTheme: async (theme) => {
    set({ theme });
    // Sync with settings
    try {
      await useSettingsStore.getState().updateSetting('theme', theme);
    } catch (error) {
      console.warn('Failed to sync theme setting:', error);
    }
  },
  
  clearError: () => set({ error: null }),
  
  // Sync app state with settings
  syncWithSettings: () => {
    const settings = useSettingsStore.getState().settings;
    set({
      isTerminalVisible: settings.terminalVisible,
      terminalHeight: settings.terminalHeight,
      sidebarCollapsed: settings.sidebarCollapsed,
      theme: settings.theme,
    });
  },
}));