import { z } from 'zod';

// Zod schemas for settings validation

export const ThemeSchema = z.enum(['light', 'dark', 'auto']);

export const NotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  caseUpdates: z.boolean(),
  systemAlerts: z.boolean(),
  soundEnabled: z.boolean(),
});

export const PrivacySettingsSchema = z.object({
  analyticsEnabled: z.boolean(),
  crashReporting: z.boolean(),
  usageStatistics: z.boolean(),
});

export const AppSettingsSchema = z.object({
  theme: ThemeSchema,
  terminalVisible: z.boolean(),
  terminalHeight: z.number().min(100).max(800),
  sidebarCollapsed: z.boolean(),
  language: z.string().min(2).max(5),
  timezone: z.string(),
  notifications: NotificationSettingsSchema,
  privacy: PrivacySettingsSchema,
});

export const StorageQuotaSchema = z.object({
  used: z.number().min(0),
  available: z.number().min(0),
  percentage: z.number().min(0).max(100),
  warning: z.boolean(),
  critical: z.boolean(),
});

export const DataCleanupOptionsSchema = z.object({
  clearCases: z.boolean(),
  clearCustomers: z.boolean(),
  clearInboxItems: z.boolean(),
  clearImages: z.boolean(),
  clearSearchHistory: z.boolean(),
  keepSettings: z.boolean(),
  confirmationRequired: z.boolean(),
});

// Data export schema (for import validation)
export const DataExportSchema = z.object({
  version: z.string(),
  timestamp: z.coerce.date(),
  settings: AppSettingsSchema,
  cases: z.array(z.any()), // Will validate against Case schema later
  customers: z.array(z.any()),
  inboxItems: z.array(z.any()),
  savedSearches: z.array(z.any()),
  imageGallery: z.array(z.any()),
});

// Default settings values
export const DEFAULT_APP_SETTINGS = {
  theme: 'auto' as const,
  terminalVisible: true,
  terminalHeight: 200,
  sidebarCollapsed: false,
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications: {
    enabled: true,
    caseUpdates: true,
    systemAlerts: true,
    soundEnabled: false,
  },
  privacy: {
    analyticsEnabled: false,
    crashReporting: false,
    usageStatistics: false,
  },
} as const;

// Validation helper functions
export function validateAppSettings(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof AppSettingsSchema>> {
  return AppSettingsSchema.safeParse(data);
}

export function validateDataExport(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof DataExportSchema>> {
  return DataExportSchema.safeParse(data);
}

export function validateDataCleanupOptions(data: unknown): z.SafeParseReturnType<unknown, z.infer<typeof DataCleanupOptionsSchema>> {
  return DataCleanupOptionsSchema.safeParse(data);
}