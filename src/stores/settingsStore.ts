import { create } from 'zustand';
import { AppSettings, StorageQuota } from '@/types';
import { settingsService } from '@/services/settingsService';
import { DEFAULT_APP_SETTINGS } from '@/utils/settingsValidation';

interface SettingsStore {
  // Settings state
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  
  // Storage quota state
  storageQuota: StorageQuota | null;
  storageBreakdown: Record<string, number> | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Storage monitoring
  loadStorageQuota: () => Promise<void>;
  loadStorageBreakdown: () => Promise<void>;
  
  // Data management
  exportData: () => Promise<void>;
  importData: (jsonString: string) => Promise<void>;
  cleanupData: (options: any) => Promise<void>;
  
  // Utility
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Initial state
  settings: { ...DEFAULT_APP_SETTINGS },
  isLoading: false,
  error: null,
  storageQuota: null,
  storageBreakdown: null,

  // Load settings from service
  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingsService.getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Update all settings
  updateSettings: async (settings: AppSettings) => {
    set({ isLoading: true, error: null });
    try {
      const result = await settingsService.saveSettings(settings);
      if (result.success) {
        set({ settings, isLoading: false });
      } else {
        set({ error: result.error.message, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Update single setting
  updateSetting: async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, [key]: value };
    await get().updateSettings(newSettings);
  },

  // Reset to defaults
  resetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await settingsService.resetSettings();
      if (result.success) {
        const settings = await settingsService.getSettings();
        set({ settings, isLoading: false });
      } else {
        set({ error: result.error.message, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset settings';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Load storage quota
  loadStorageQuota: async () => {
    try {
      const result = await settingsService.getStorageQuota();
      if (result.success) {
        set({ storageQuota: result.data });
      } else {
        console.warn('Failed to load storage quota:', result.error);
      }
    } catch (error) {
      console.warn('Failed to load storage quota:', error);
    }
  },

  // Load storage breakdown
  loadStorageBreakdown: async () => {
    try {
      const result = await settingsService.getStorageBreakdown();
      if (result.success) {
        set({ storageBreakdown: result.data });
      } else {
        console.warn('Failed to load storage breakdown:', result.error);
      }
    } catch (error) {
      console.warn('Failed to load storage breakdown:', error);
    }
  },

  // Export data
  exportData: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await settingsService.downloadExport();
      if (result.success) {
        set({ isLoading: false });
      } else {
        set({ error: result.error.message, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Import data
  importData: async (jsonString: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await settingsService.importData(jsonString);
      if (result.success) {
        // Reload settings after import
        await get().loadSettings();
        set({ isLoading: false });
      } else {
        set({ error: result.error.message, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import data';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Cleanup data
  cleanupData: async (options: any) => {
    set({ isLoading: true, error: null });
    try {
      const result = await settingsService.cleanupData(options);
      if (result.success) {
        // Reload data after cleanup
        await Promise.all([
          get().loadSettings(),
          get().loadStorageQuota(),
          get().loadStorageBreakdown(),
        ]);
        set({ isLoading: false });
      } else {
        set({ error: result.error.message, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup data';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Set error
  setError: (error: string | null) => set({ error }),

  // Clear error
  clearError: () => set({ error: null }),
}));