import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';
import { DataCleanupOptions } from '@/types';

const SettingsPage: React.FC = () => {
  const {
    settings,
    isLoading,
    error,
    storageQuota,
    storageBreakdown,
    loadSettings,
    updateSetting,
    resetSettings,
    loadStorageQuota,
    loadStorageBreakdown,
    exportData,
    importData,
    cleanupData,
    clearError
  } = useSettingsStore();

  const { syncWithSettings } = useAppStore();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupOptions, setCleanupOptions] = useState<DataCleanupOptions>({
    clearCases: false,
    clearCustomers: false,
    clearInboxItems: false,
    clearImages: false,
    clearSearchHistory: false,
    keepSettings: true,
    confirmationRequired: true,
  });

  useEffect(() => {
    loadSettings();
    loadStorageQuota();
    loadStorageBreakdown();
  }, [loadSettings, loadStorageQuota, loadStorageBreakdown]);

  useEffect(() => {
    // Sync app store when settings change
    syncWithSettings();
  }, [settings, syncWithSettings]);

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    await updateSetting('theme', theme);
  };

  const handleNotificationChange = async (key: keyof typeof settings.notifications, value: boolean) => {
    await updateSetting('notifications', {
      ...settings.notifications,
      [key]: value
    });
  };

  const handlePrivacyChange = async (key: keyof typeof settings.privacy, value: boolean) => {
    await updateSetting('privacy', {
      ...settings.privacy,
      [key]: value
    });
  };

  const handleImportFile = async () => {
    if (!importFile) return;
    
    try {
      const text = await importFile.text();
      await importData(text);
      setImportFile(null);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleCleanup = async () => {
    if (cleanupOptions.confirmationRequired) {
      if (!confirm('Are you sure you want to clean up the selected data? This action cannot be undone.')) {
        return;
      }
    }
    
    await cleanupData(cleanupOptions);
    setShowCleanupModal(false);
  };

  if (isLoading && !settings) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Customize your Smart Support Agent experience</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🎨 Appearance</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'light', label: '☀️ Light' },
                  { value: 'dark', label: '🌙 Dark' },
                  { value: 'auto', label: '🔄 Auto' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value as any)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      settings.theme === value
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🔔 Notifications</h2>
          
          <div className="space-y-4">
            {[
              { key: 'enabled', label: 'Enable notifications', desc: 'Receive system notifications' },
              { key: 'caseUpdates', label: 'Case updates', desc: 'Notify when cases are updated' },
              { key: 'systemAlerts', label: 'System alerts', desc: 'Important system messages' },
              { key: 'soundEnabled', label: 'Sound effects', desc: 'Play sounds for notifications' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-gray-500">{desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications[key as keyof typeof settings.notifications]}
                  onChange={(e) => handleNotificationChange(key as any, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🔒 Privacy</h2>
          
          <div className="space-y-4">
            {[
              { key: 'analyticsEnabled', label: 'Analytics', desc: 'Help improve the app with usage data' },
              { key: 'crashReporting', label: 'Crash reporting', desc: 'Automatically report crashes' },
              { key: 'usageStatistics', label: 'Usage statistics', desc: 'Share anonymous usage data' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-gray-500">{desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy[key as keyof typeof settings.privacy]}
                  onChange={(e) => handlePrivacyChange(key as any, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Storage Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">💾 Storage</h2>
          
          {storageQuota && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Storage used</span>
                <span>{Math.round(storageQuota.percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    storageQuota.critical ? 'bg-red-500' :
                    storageQuota.warning ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${storageQuota.percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(storageQuota.used / 1024 / 1024).toFixed(1)} MB used of{' '}
                {((storageQuota.used + storageQuota.available) / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          )}

          {storageBreakdown && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Storage breakdown</h3>
              <div className="space-y-2">
                {Object.entries(storageBreakdown).map(([key, count]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span>{count} items</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📁 Data Management</h2>
          
          <div className="space-y-4">
            {/* Export */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Export data</div>
                <div className="text-sm text-gray-500">Download all your data as JSON</div>
              </div>
              <button
                onClick={exportData}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Export
              </button>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Import data</div>
                <div className="text-sm text-gray-500">Restore data from backup file</div>
              </div>
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Choose File
                </label>
                {importFile && (
                  <button
                    onClick={handleImportFile}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Import
                  </button>
                )}
              </div>
            </div>

            {/* Cleanup */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Clean up data</div>
                <div className="text-sm text-gray-500">Remove selected data types</div>
              </div>
              <button
                onClick={() => setShowCleanupModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Clean Up
              </button>
            </div>

            {/* Reset */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Reset settings</div>
                <div className="text-sm text-gray-500">Restore default settings</div>
              </div>
              <button
                onClick={resetSettings}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Clean Up Data</h3>
            
            <div className="space-y-3 mb-6">
              {[
                { key: 'clearCases', label: 'Clear all cases' },
                { key: 'clearCustomers', label: 'Clear all customers' },
                { key: 'clearInboxItems', label: 'Clear inbox items' },
                { key: 'clearImages', label: 'Clear image gallery' },
                { key: 'clearSearchHistory', label: 'Clear search history' },
                { key: 'keepSettings', label: 'Keep settings (recommended)' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={cleanupOptions[key as keyof DataCleanupOptions] as boolean}
                    onChange={(e) => setCleanupOptions(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCleanupModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCleanup}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Clean Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;