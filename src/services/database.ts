import Dexie, { Table } from 'dexie';
import {
  Case,
  Customer,
  InboxItem,
  Artifact,
  ImageGallery,
  HivemindReport,
  HivemindPreCheck,
  SearchIndex,
  SavedSearch,
  UserSettings,
  CaseHistory,
  ContentPattern,
  Analytics,
  CommandHistory,
  AnnotationData
} from '@/types';

export class SmartSupportDatabase extends Dexie {
  // Core entities
  cases!: Table<Case>;
  customers!: Table<Customer>;
  inboxItems!: Table<InboxItem>;
  artifacts!: Table<Artifact>;
  imageGallery!: Table<ImageGallery>;
  
  // Reports and documentation
  hivemindReports!: Table<HivemindReport>;
  hivemindPreChecks!: Table<HivemindPreCheck>;
  
  // Search and indexing
  searchIndex!: Table<SearchIndex>;
  savedSearches!: Table<SavedSearch>;
  
  // Settings and preferences
  userSettings!: Table<UserSettings>;
  
  // History and tracking
  caseHistory!: Table<CaseHistory>;
  commandHistory!: Table<CommandHistory>;
  
  // Intelligence and analytics
  contentPatterns!: Table<ContentPattern>;
  analytics!: Table<Analytics>;
  
  // Annotations
  annotations!: Table<AnnotationData>;

  constructor() {
    super('SmartSupportDatabase');
    
    this.version(1).stores({
      // Core entities with proper indexes
      cases: 'id, caseNumber, status, priority, classification, customerId, createdAt, updatedAt, assignedTo',
      customers: 'id, email, company, createdAt, relationshipStrength',
      inboxItems: 'id, contentType, source, confidence, createdAt, processedAt, caseId',
      artifacts: 'id, caseId, filename, fileType, createdAt',
      imageGallery: 'id, filename, caseId, createdAt',
      
      // Reports and documentation
      hivemindReports: 'id, caseId, createdAt, updatedAt, completenessScore',
      hivemindPreChecks: 'id, name',
      
      // Search and indexing
      searchIndex: 'id, entityId, entityType, createdAt, updatedAt',
      savedSearches: 'id, name, createdAt, lastUsed, useCount',
      
      // Settings and preferences
      userSettings: 'id, theme, createdAt, updatedAt',
      
      // History and tracking
      caseHistory: 'id, caseId, action, timestamp, userId',
      commandHistory: 'id, command, executedAt, success',
      
      // Intelligence and analytics
      contentPatterns: 'id, patternType, category, confidence, successRate',
      analytics: 'id, metricType, timestamp, period',
      
      // Annotations
      annotations: 'id, type, layerId, createdAt'
    });

    // Add hooks for automatic timestamping
    this.cases.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.cases.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    this.customers.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.customers.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    this.inboxItems.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
    });

    this.artifacts.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
    });

    this.imageGallery.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
    });

    this.hivemindReports.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.hivemindReports.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    this.searchIndex.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.searchIndex.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    this.savedSearches.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.lastUsed = new Date();
      obj.useCount = 1;
    });

    this.userSettings.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.userSettings.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.updatedAt = new Date();
    });

    this.caseHistory.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = new Date();
    });

    this.commandHistory.hook('creating', (primKey, obj, trans) => {
      obj.executedAt = new Date();
    });

    this.contentPatterns.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
    });

    this.analytics.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = new Date();
    });

    this.annotations.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
    });
  }

  /**
   * Initialize database with default data
   */
  async initializeDefaults(): Promise<void> {
    const transaction = this.transaction('rw', [
      this.userSettings,
      this.hivemindPreChecks,
      this.contentPatterns
    ], async () => {
      // Check if defaults already exist
      const existingSettings = await this.userSettings.count();
      if (existingSettings === 0) {
        await this.userSettings.add({
          id: 'default-settings',
          theme: 'light',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          displayPreferences: {
            caseListPageSize: 25,
            showThumbnails: true,
            compactView: false,
            defaultSort: 'createdAt'
          },
          searchPreferences: {
            includeClosedCases: false,
            searchHistory: true,
            autoComplete: true,
            maxResults: 50
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Initialize Hivemind pre-checks
      const existingPreChecks = await this.hivemindPreChecks.count();
      if (existingPreChecks === 0) {
        const preChecks: HivemindPreCheck[] = [
          {
            id: 'domo-jiras',
            name: 'DOMO Jiras',
            checked: false,
            description: 'Check existing DOMO JIRA tickets for similar issues'
          },
          {
            id: 'salesforce-kb',
            name: 'Salesforce KB',
            checked: false,
            description: 'Search Salesforce Knowledge Base for related articles'
          },
          {
            id: 'other-hiveminds',
            name: 'Other Hiveminds',
            checked: false,
            description: 'Review other Hivemind reports for similar patterns'
          },
          {
            id: 'other-sf-cases',
            name: 'Other Salesforce Cases',
            checked: false,
            description: 'Check other Salesforce cases for precedent'
          },
          {
            id: 'warrooms',
            name: 'Warrooms',
            checked: false,
            description: 'Review warroom discussions and resolutions'
          }
        ];

        await this.hivemindPreChecks.bulkAdd(preChecks);
      }

      // Initialize basic content patterns
      const existingPatterns = await this.contentPatterns.count();
      if (existingPatterns === 0) {
        const patterns: ContentPattern[] = [
          {
            id: crypto.randomUUID(),
            pattern: 'error|failed|exception|crash',
            patternType: 'keyword',
            category: 'error',
            confidence: 0.8,
            examples: ['Database connection failed', 'Exception in thread main'],
            createdAt: new Date(),
            successRate: 0.85
          },
          {
            id: crypto.randomUUID(),
            pattern: 'how to|can I|is it possible|tutorial',
            patternType: 'keyword',
            category: 'query',
            confidence: 0.7,
            examples: ['How to create a dashboard?', 'Can I export data?'],
            createdAt: new Date(),
            successRate: 0.90
          }
        ];

        await this.contentPatterns.bulkAdd(patterns);
      }
    });
  }

  /**
   * Clear all data (for development/testing)
   */
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      for (const table of this.tables) {
        await table.clear();
      }
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    
    for (const table of this.tables) {
      stats[table.name] = await table.count();
    }
    
    return stats;
  }

  /**
   * Export all data to JSON
   */
  async exportData(): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};
    
    for (const table of this.tables) {
      data[table.name] = await table.toArray();
    }
    
    return data;
  }
}

// Create singleton instance
export const db = new SmartSupportDatabase();

// Initialize database when module loads
db.open().then(() => {
  console.log('SmartSupport database opened successfully');
  return db.initializeDefaults();
}).catch(error => {
  console.error('Failed to open SmartSupport database:', error);
});