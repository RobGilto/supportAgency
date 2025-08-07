import { SavedSearch, SearchFilters, Result } from '@/types';
import { BaseRepository } from './base';
import { database } from '@/services/database';

export interface SavedSearchStats {
  totalSavedSearches: number;
  mostUsedFilters: Array<{ filter: string; count: number }>;
  averageSearchComplexity: number;
  recentSearches: SavedSearch[];
}

export class SavedSearchRepository extends BaseRepository<SavedSearch> {
  constructor() {
    super(database.savedSearches);
  }

  /**
   * Find saved searches by name (fuzzy matching)
   */
  async findByName(name: string): Promise<Result<SavedSearch[]>> {
    try {
      const searches = await this.table
        .filter(search => search.name.toLowerCase().includes(name.toLowerCase()))
        .sortBy('createdAt');

      return { success: true, data: searches.reverse() };
    } catch (error) {
      return this.handleError(error, `Failed to find saved searches by name: ${name}`);
    }
  }

  /**
   * Find saved searches that use specific filters
   */
  async findByFilters(filters: Partial<SearchFilters>): Promise<Result<SavedSearch[]>> {
    try {
      const searches = await this.table.toArray();
      
      const matchingSearches = searches.filter(search => {
        return this.filtersMatch(search.filters, filters);
      });

      return { success: true, data: matchingSearches };
    } catch (error) {
      return this.handleError(error, 'Failed to find saved searches by filters');
    }
  }

  /**
   * Get most recently used saved searches
   */
  async getRecentSearches(limit: number = 10): Promise<Result<SavedSearch[]>> {
    try {
      const searches = await this.table
        .orderBy('createdAt')
        .reverse()
        .limit(limit)
        .toArray();

      return { success: true, data: searches };
    } catch (error) {
      return this.handleError(error, 'Failed to get recent searches');
    }
  }

  /**
   * Update saved search with new parameters
   */
  async updateSearch(id: string, updates: Partial<Pick<SavedSearch, 'name' | 'query' | 'filters'>>): Promise<Result<SavedSearch>> {
    try {
      const existingSearch = await this.findById(id);
      if (!existingSearch.success) {
        return existingSearch;
      }

      const updatedSearch = {
        ...existingSearch.data,
        ...updates
      };

      await this.table.update(id, updates);
      
      return { success: true, data: updatedSearch };
    } catch (error) {
      return this.handleError(error, `Failed to update saved search: ${id}`);
    }
  }

  /**
   * Duplicate a saved search with a new name
   */
  async duplicateSearch(id: string, newName: string): Promise<Result<SavedSearch>> {
    try {
      const originalSearch = await this.findById(id);
      if (!originalSearch.success) {
        return originalSearch;
      }

      const duplicateSearch: SavedSearch = {
        id: this.generateId(),
        name: newName,
        query: originalSearch.data.query,
        filters: { ...originalSearch.data.filters },
        createdAt: new Date()
      };

      const createResult = await this.create(duplicateSearch);
      return createResult;
    } catch (error) {
      return this.handleError(error, `Failed to duplicate saved search: ${id}`);
    }
  }

  /**
   * Get saved search statistics
   */
  async getStatistics(): Promise<Result<SavedSearchStats>> {
    try {
      const searches = await this.table.toArray();

      if (searches.length === 0) {
        return {
          success: true,
          data: {
            totalSavedSearches: 0,
            mostUsedFilters: [],
            averageSearchComplexity: 0,
            recentSearches: []
          }
        };
      }

      // Count filter usage
      const filterUsage: Record<string, number> = {};
      let totalComplexity = 0;

      for (const search of searches) {
        const complexity = this.calculateSearchComplexity(search);
        totalComplexity += complexity;

        // Count each type of filter used
        const filters = search.filters;
        if (filters.status && filters.status.length > 0) {
          filterUsage['status'] = (filterUsage['status'] || 0) + 1;
        }
        if (filters.priority && filters.priority.length > 0) {
          filterUsage['priority'] = (filterUsage['priority'] || 0) + 1;
        }
        if (filters.classification && filters.classification.length > 0) {
          filterUsage['classification'] = (filterUsage['classification'] || 0) + 1;
        }
        if (filters.dateRange) {
          filterUsage['dateRange'] = (filterUsage['dateRange'] || 0) + 1;
        }
        if (filters.tags && filters.tags.length > 0) {
          filterUsage['tags'] = (filterUsage['tags'] || 0) + 1;
        }
        if (filters.customerId) {
          filterUsage['customerId'] = (filterUsage['customerId'] || 0) + 1;
        }
      }

      // Sort filters by usage
      const mostUsedFilters = Object.entries(filterUsage)
        .map(([filter, count]) => ({ filter, count }))
        .sort((a, b) => b.count - a.count);

      // Get recent searches
      const recentSearches = searches
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      return {
        success: true,
        data: {
          totalSavedSearches: searches.length,
          mostUsedFilters,
          averageSearchComplexity: totalComplexity / searches.length,
          recentSearches
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get saved search statistics');
    }
  }

  /**
   * Clean up old or unused saved searches
   */
  async cleanupOldSearches(olderThanDays: number = 90): Promise<Result<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldSearches = await this.table
        .where('createdAt')
        .below(cutoffDate)
        .toArray();

      if (oldSearches.length === 0) {
        return { success: true, data: 0 };
      }

      const idsToDelete = oldSearches.map(search => search.id);
      await this.table.bulkDelete(idsToDelete);

      return { success: true, data: idsToDelete.length };
    } catch (error) {
      return this.handleError(error, 'Failed to cleanup old searches');
    }
  }

  /**
   * Export saved searches for backup
   */
  async exportSearches(): Promise<Result<SavedSearch[]>> {
    try {
      const searches = await this.table.toArray();
      return { success: true, data: searches };
    } catch (error) {
      return this.handleError(error, 'Failed to export saved searches');
    }
  }

  /**
   * Import saved searches from backup
   */
  async importSearches(searches: SavedSearch[], overwriteExisting: boolean = false): Promise<Result<{ imported: number; skipped: number }>> {
    try {
      let imported = 0;
      let skipped = 0;

      for (const search of searches) {
        // Check if search already exists by name
        const existingResult = await this.findByName(search.name);
        
        if (existingResult.success && existingResult.data.length > 0 && !overwriteExisting) {
          skipped++;
          continue;
        }

        // Validate search structure
        if (!this.validateSavedSearch(search)) {
          skipped++;
          continue;
        }

        try {
          if (overwriteExisting && existingResult.success && existingResult.data.length > 0) {
            // Update existing search
            const existingId = existingResult.data[0].id;
            await this.table.update(existingId, {
              query: search.query,
              filters: search.filters,
              createdAt: search.createdAt
            });
          } else {
            // Create new search
            await this.table.add({
              ...search,
              id: this.generateId() // Generate new ID to avoid conflicts
            });
          }
          imported++;
        } catch (error) {
          console.warn(`Failed to import search "${search.name}":`, error);
          skipped++;
        }
      }

      return { success: true, data: { imported, skipped } };
    } catch (error) {
      return this.handleError(error, 'Failed to import saved searches');
    }
  }

  /**
   * Check if two filter objects match
   */
  private filtersMatch(searchFilters: SearchFilters, targetFilters: Partial<SearchFilters>): boolean {
    for (const [key, value] of Object.entries(targetFilters)) {
      if (key === 'dateRange') {
        // Special handling for date range
        continue; // TODO: Implement date range matching
      }

      const searchValue = (searchFilters as any)[key];
      
      if (Array.isArray(value) && Array.isArray(searchValue)) {
        // Check if arrays have any common elements
        if (!value.some(v => searchValue.includes(v))) {
          return false;
        }
      } else if (searchValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate complexity score for a search (0-1)
   */
  private calculateSearchComplexity(search: SavedSearch): number {
    let complexity = 0;
    const maxComplexity = 10; // Arbitrary maximum

    // Query text complexity
    if (search.query) {
      const words = search.query.split(/\s+/);
      complexity += Math.min(words.length, 5) * 0.5; // Up to 2.5 points for query
    }

    // Filter complexity
    const filters = search.filters;
    if (filters.status && filters.status.length > 0) complexity += filters.status.length * 0.3;
    if (filters.priority && filters.priority.length > 0) complexity += filters.priority.length * 0.3;
    if (filters.classification && filters.classification.length > 0) complexity += filters.classification.length * 0.3;
    if (filters.dateRange) complexity += 1;
    if (filters.tags && filters.tags.length > 0) complexity += Math.min(filters.tags.length, 5) * 0.2;
    if (filters.customerId) complexity += 0.5;

    return Math.min(complexity / maxComplexity, 1);
  }

  /**
   * Validate saved search structure
   */
  private validateSavedSearch(search: SavedSearch): boolean {
    if (!search.id || !search.name || search.createdAt === undefined) {
      return false;
    }

    if (typeof search.query !== 'string' || typeof search.filters !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * Generate a unique ID for a saved search
   */
  private generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : 
           'search-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const savedSearchRepository = new SavedSearchRepository();