/**
 * Settings functionality test suite
 * Tests the complete settings system including persistence, validation, and data management
 */

import { settingsService } from '@/services/settingsService';
import { DEFAULT_APP_SETTINGS } from '@/utils/settingsValidation';

export class SettingsTestSuite {
  async runAllTests(): Promise<void> {
    console.log('🧪 Running Settings Test Suite...\n');
    
    try {
      await this.testSettingsLoading();
      await this.testSettingsUpdate();
      await this.testSettingsValidation();
      await this.testStorageQuota();
      await this.testDataExport();
      await this.testSettingsReset();
      
      console.log('✅ All settings tests passed!');
    } catch (error) {
      console.error('❌ Settings test failed:', error);
    }
  }

  private async testSettingsLoading(): Promise<void> {
    console.log('Testing settings loading...');
    
    const settings = await settingsService.getSettings();
    
    // Should return valid settings object
    if (!settings.theme || !settings.notifications || !settings.privacy) {
      throw new Error('Invalid settings structure returned');
    }
    
    // Should match expected schema
    if (typeof settings.terminalHeight !== 'number' || 
        typeof settings.sidebarCollapsed !== 'boolean') {
      throw new Error('Settings have incorrect types');
    }
    
    console.log('✓ Settings loading works correctly');
  }

  private async testSettingsUpdate(): Promise<void> {
    console.log('Testing settings updates...');
    
    // Get current settings
    const originalSettings = await settingsService.getSettings();
    
    // Update theme
    const updateResult = await settingsService.updateSetting('theme', 'dark');
    if (!updateResult.success) {
      throw new Error('Failed to update theme setting');
    }
    
    // Verify update
    const updatedSettings = await settingsService.getSettings();
    if (updatedSettings.theme !== 'dark') {
      throw new Error('Theme setting was not updated correctly');
    }
    
    // Restore original
    await settingsService.updateSetting('theme', originalSettings.theme);
    
    console.log('✓ Settings updates work correctly');
  }

  private async testSettingsValidation(): Promise<void> {
    console.log('Testing settings validation...');
    
    // Test invalid settings
    const invalidSettings = {
      ...DEFAULT_APP_SETTINGS,
      theme: 'invalid-theme',
      terminalHeight: -100
    } as any;
    
    const result = await settingsService.saveSettings(invalidSettings);
    if (result.success) {
      throw new Error('Invalid settings were accepted');
    }
    
    console.log('✓ Settings validation works correctly');
  }

  private async testStorageQuota(): Promise<void> {
    console.log('Testing storage quota...');
    
    const quotaResult = await settingsService.getStorageQuota();
    if (!quotaResult.success) {
      throw new Error('Failed to get storage quota');
    }
    
    const quota = quotaResult.data;
    if (typeof quota.used !== 'number' || 
        typeof quota.available !== 'number' ||
        typeof quota.percentage !== 'number') {
      throw new Error('Storage quota has invalid structure');
    }
    
    console.log('✓ Storage quota works correctly');
  }

  private async testDataExport(): Promise<void> {
    console.log('Testing data export...');
    
    const exportResult = await settingsService.exportData();
    if (!exportResult.success) {
      throw new Error('Failed to export data');
    }
    
    const exportData = exportResult.data;
    if (!exportData.version || !exportData.settings || !exportData.timestamp) {
      throw new Error('Export data has invalid structure');
    }
    
    console.log('✓ Data export works correctly');
  }

  private async testSettingsReset(): Promise<void> {
    console.log('Testing settings reset...');
    
    // Modify a setting
    await settingsService.updateSetting('terminalHeight', 350);
    
    // Reset settings
    const resetResult = await settingsService.resetSettings();
    if (!resetResult.success) {
      throw new Error('Failed to reset settings');
    }
    
    // Verify reset
    const resetSettings = await settingsService.getSettings();
    if (resetSettings.terminalHeight !== DEFAULT_APP_SETTINGS.terminalHeight) {
      throw new Error('Settings were not reset correctly');
    }
    
    console.log('✓ Settings reset works correctly');
  }
}

// Export test runner function
export async function runSettingsTests(): Promise<void> {
  const testSuite = new SettingsTestSuite();
  await testSuite.runAllTests();
}

// Browser console runner
(window as any).runSettingsTests = runSettingsTests;