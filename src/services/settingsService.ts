import { AppSettings, StorageQuota, DataExport, DataCleanupOptions, Result } from '@/types';
import { 
  validateAppSettings, 
  validateDataExport, 
  validateDataCleanupOptions,
  DEFAULT_APP_SETTINGS 
} from '@/utils/settingsValidation';
import { db } from './database';
import { caseRepository } from './repositories/CaseRepository';

const SETTINGS_KEY = 'smart-support-agent-settings';
const SETTINGS_VERSION = '1.0.0';

class SettingsService {
  private cachedSettings: AppSettings | null = null;

  /**
   * Get current app settings, with fallback to defaults
   */
  async getSettings(): Promise<AppSettings> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      // Try to load from localStorage first (simple settings)
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validation = validateAppSettings(parsed);
        
        if (validation.success) {
          this.cachedSettings = validation.data;
          return validation.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }

    // Fallback to defaults
    this.cachedSettings = { ...DEFAULT_APP_SETTINGS };
    await this.saveSettings(this.cachedSettings);
    return this.cachedSettings;
  }

  /**
   * Save settings to localStorage
   */
  async saveSettings(settings: AppSettings): Promise<Result<void>> {
    try {
      const validation = validateAppSettings(settings);
      if (!validation.success) {
        return {
          success: false,
          error: new Error(`Invalid settings: ${validation.error.message}`)
        };
      }

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      this.cachedSettings = settings;

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to save settings')
      };
    }
  }

  /**
   * Update specific setting
   */
  async updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): Promise<Result<void>> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, [key]: value };
    return this.saveSettings(updatedSettings);
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<Result<void>> {
    this.cachedSettings = null;
    try {
      localStorage.removeItem(SETTINGS_KEY);
      const defaultSettings = { ...DEFAULT_APP_SETTINGS };
      return this.saveSettings(defaultSettings);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to reset settings')
      };
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageQuota(): Promise<Result<StorageQuota>> {
    try {
      if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
        // Fallback for browsers without Storage API
        return {
          success: true,
          data: {
            used: 0,
            available: 50 * 1024 * 1024, // 50MB estimate
            percentage: 0,
            warning: false,
            critical: false
          }
        };
      }

      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 50 * 1024 * 1024; // 50MB fallback
      const percentage = (used / quota) * 100;

      return {
        success: true,
        data: {
          used,
          available: quota - used,
          percentage,
          warning: percentage > 75,
          critical: percentage > 90
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get storage quota')
      };
    }
  }

  /**
   * Export all application data
   */
  async exportData(): Promise<Result<DataExport>> {
    try {
      const settings = await this.getSettings();
      
      // Get all data from repositories
      const [casesResult] = await Promise.all([
        caseRepository.findAll(),
        // Add other repository calls as they become available
      ]);

      if (!casesResult.success) {
        return { success: false, error: casesResult.error };
      }

      const exportData: DataExport = {
        version: SETTINGS_VERSION,
        timestamp: new Date(),
        settings,
        cases: casesResult.data,
        customers: [], // Will be populated when customer repository is available
        inboxItems: [],
        savedSearches: [],
        imageGallery: []
      };

      return { success: true, data: exportData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to export data')
      };
    }
  }

  /**
   * Import application data
   */
  async importData(jsonString: string): Promise<Result<void>> {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = validateDataExport(parsed);

      if (!validation.success) {
        return {
          success: false,
          error: new Error(`Invalid data format: ${validation.error.message}`)
        };
      }

      const importData = validation.data;

      // Import settings
      const settingsResult = await this.saveSettings(importData.settings);
      if (!settingsResult.success) {
        return settingsResult;
      }

      // Import cases
      for (const caseData of importData.cases) {
        const createResult = await caseRepository.create(caseData);
        if (!createResult.success) {
          console.warn('Failed to import case:', caseData.id, createResult.error);
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to import data')
      };
    }
  }

  /**
   * Clean up application data
   */
  async cleanupData(options: DataCleanupOptions): Promise<Result<void>> {
    try {
      const validation = validateDataCleanupOptions(options);
      if (!validation.success) {
        return {
          success: false,
          error: new Error(`Invalid cleanup options: ${validation.error.message}`)
        };
      }

      const cleanupOptions = validation.data;

      // Clear cases if requested
      if (cleanupOptions.clearCases) {
        const allCases = await caseRepository.findAll();
        if (allCases.success) {
          for (const case_ of allCases.data) {
            await caseRepository.delete(case_.id);
          }
        }
      }

      // Clear other data types as repositories become available
      // This will be expanded in future stories

      // Clear IndexedDB if needed
      if (cleanupOptions.clearCases || cleanupOptions.clearCustomers || 
          cleanupOptions.clearInboxItems || cleanupOptions.clearImages) {
        // Could implement more granular cleanup here
      }

      // Keep settings unless explicitly cleared
      if (!cleanupOptions.keepSettings) {
        await this.resetSettings();
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to cleanup data')
      };
    }
  }

  /**
   * Download data export as JSON file
   */
  async downloadExport(): Promise<Result<void>> {
    try {
      const exportResult = await this.exportData();
      if (!exportResult.success) {
        return exportResult;
      }

      const jsonString = JSON.stringify(exportResult.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `smart-support-agent-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to download export')
      };
    }
  }

  /**
   * Get storage usage breakdown
   */
  async getStorageBreakdown(): Promise<Result<Record<string, number>>> {
    try {
      const dbStats = await db.getStats();
      
      return {
        success: true,
        data: {
          cases: dbStats.cases || 0,
          customers: dbStats.customers || 0,
          inboxItems: dbStats.inboxItems || 0,
          imageGallery: dbStats.imageGallery || 0,
          searchIndex: dbStats.searchIndex || 0,
          settings: 1, // Always 1 settings object
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get storage breakdown')
      };
    }
  }
}

export const settingsService = new SettingsService();