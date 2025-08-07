import { 
  Result, 
  SearchIndex, 
  SearchEntityType, 
  SearchFilters,
  SavedSearch,
  SearchQuery,
  SearchResult,
  SearchMatch,
  SearchSuggestion,
  SearchStats,
  SearchSortField
} from '@/types';
import { generateUUID } from '@/utils/generators';
import { db } from '@/services/database';


export class SearchService {
  private readonly MIN_QUERY_LENGTH = 2;
  private readonly MAX_SUGGESTIONS = 10;
  private readonly DEFAULT_LIMIT = 20;
  private readonly SNIPPET_LENGTH = 150;
  
  // Stop words to exclude from search indexing
  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);

  /**
   * Perform full-text search across all indexed entities
   */
  async search(query: SearchQuery): Promise<Result<{ results: SearchResult[]; stats: SearchStats }>> {
    const startTime = performance.now();
    
    try {
      if (query.text && query.text.length < this.MIN_QUERY_LENGTH && !query.filters) {
        return { 
          success: true, 
          data: { 
            results: [], 
            stats: {
              totalResults: 0,
              searchTime: performance.now() - startTime,
              mostRelevantScore: 0,
              entityBreakdown: {} as Record<SearchEntityType, number>,
              filterBreakdown: {}
            }
          } 
        };
      }

      // Get search indexes based on filters
      let searchIndexes = await this.getFilteredIndexes(query.filters);
      
      // If there's a text query, perform full-text search
      if (query.text && query.text.trim().length >= this.MIN_QUERY_LENGTH) {
        searchIndexes = await this.performTextSearch(query.text, searchIndexes);
      }

      // Calculate relevance scores
      const scoredResults = await this.calculateRelevanceScores(query.text || '', searchIndexes);

      // Sort results
      const sortedResults = this.sortResults(scoredResults, query.sortBy || 'relevance', query.sortOrder || 'desc');

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || this.DEFAULT_LIMIT;
      const paginatedResults = sortedResults.slice(offset, offset + limit);

      // Enrich results with entity data
      const enrichedResults = await this.enrichResultsWithEntities(paginatedResults);

      // Generate statistics
      const stats = this.generateSearchStats(enrichedResults, sortedResults.length, startTime);

      return {
        success: true,
        data: {
          results: enrichedResults,
          stats
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Search failed')
      };
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string): Promise<Result<SearchSuggestion[]>> {
    try {
      if (partialQuery.length < this.MIN_QUERY_LENGTH) {
        return { success: true, data: [] };
      }

      const suggestions: SearchSuggestion[] = [];
      const queryLower = partialQuery.toLowerCase();

      // Get autocomplete suggestions from search index
      const autocompleteSuggestions = await this.getAutocompleteSuggestions(queryLower);
      suggestions.push(...autocompleteSuggestions);

      // Get recent search suggestions (if implemented)
      const recentSuggestions = await this.getRecentSearchSuggestions(queryLower);
      suggestions.push(...recentSuggestions);

      // Get popular search suggestions
      const popularSuggestions = await this.getPopularSearchSuggestions(queryLower);
      suggestions.push(...popularSuggestions);

      // Remove duplicates and limit results
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
      
      return {
        success: true,
        data: uniqueSuggestions.slice(0, this.MAX_SUGGESTIONS)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get suggestions')
      };
    }
  }

  /**
   * Save a search query for later use
   */
  async saveSearch(name: string, query: SearchQuery): Promise<Result<SavedSearch>> {
    try {
      const savedSearch: SavedSearch = {
        id: generateUUID(),
        name,
        query: query.text || '',
        filters: query.filters || {},
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 1
      };

      await db.savedSearches.add(savedSearch);
      
      return { success: true, data: savedSearch };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to save search')
      };
    }
  }

  /**
   * Get all saved searches
   */
  async getSavedSearches(): Promise<Result<SavedSearch[]>> {
    try {
      const savedSearches = await db.savedSearches
        .orderBy('createdAt')
        .reverse()
        .toArray();

      return { success: true, data: savedSearches };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get saved searches')
      };
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(id: string): Promise<Result<void>> {
    try {
      await db.savedSearches.delete(id);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to delete saved search')
      };
    }
  }

  /**
   * Rebuild search index for all entities
   */
  async rebuildSearchIndex(): Promise<Result<{ indexed: number; skipped: number }>> {
    try {
      let indexed = 0;
      let skipped = 0;

      // Clear existing index
      await db.searchIndex.clear();

      // Index cases
      const cases = await db.cases.toArray();
      for (const case_ of cases) {
        const result = await this.indexEntity(case_.id, 'case', {
          title: case_.title,
          content: case_.description || '',
          tags: case_.tags || []
        });
        
        if (result.success) indexed++; else skipped++;
      }

      // Index inbox items
      const inboxItems = await db.inboxItems.toArray();
      for (const item of inboxItems) {
        const result = await this.indexEntity(item.id, 'inbox', {
          title: `Inbox Item - ${item.contentType}`,
          content: item.content,
          tags: []
        });
        
        if (result.success) indexed++; else skipped++;
      }

      // Index image gallery items
      const images = await db.imageGallery.toArray();
      for (const image of images) {
        const result = await this.indexEntity(image.id, 'image', {
          title: image.filename,
          content: `${image.filename} ${image.tags?.join(' ')} ${image.originalFormat}`,
          tags: image.tags || []
        });
        
        if (result.success) indexed++; else skipped++;
      }

      return { success: true, data: { indexed, skipped } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to rebuild search index')
      };
    }
  }

  /**
   * Index a single entity
   */
  async indexEntity(
    entityId: string, 
    entityType: SearchEntityType, 
    data: { title: string; content: string; tags: string[] }
  ): Promise<Result<SearchIndex>> {
    try {
      // Create search content by combining all searchable text
      const searchContent = [
        data.title,
        data.content,
        data.tags.join(' ')
      ].join(' ').toLowerCase();

      // Remove existing index for this entity
      await db.searchIndex.where('entityId').equals(entityId).delete();

      const searchIndex: SearchIndex = {
        id: generateUUID(),
        entityId,
        entityType,
        content: searchContent,
        title: data.title,
        tags: data.tags,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.searchIndex.add(searchIndex);
      
      return { success: true, data: searchIndex };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to index entity')
      };
    }
  }

  /**
   * Update search index for a specific entity
   */
  async updateIndex(
    entityId: string, 
    entityType: SearchEntityType, 
    data: { title: string; content: string; tags: string[] }
  ): Promise<Result<SearchIndex>> {
    return this.indexEntity(entityId, entityType, data);
  }

  /**
   * Remove entity from search index
   */
  async removeFromIndex(entityId: string): Promise<Result<void>> {
    try {
      await db.searchIndex.where('entityId').equals(entityId).delete();
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to remove from index')
      };
    }
  }

  /**
   * Get filtered search indexes
   */
  private async getFilteredIndexes(filters?: SearchFilters): Promise<SearchIndex[]> {
    let indexes = await db.searchIndex.toArray();

    if (!filters) return indexes;

    // Apply entity type filtering if needed (this would require extending SearchFilters)
    // For now, we'll filter by what we have in SearchFilters

    return indexes; // TODO: Implement actual filtering based on entity properties
  }

  /**
   * Perform full-text search on indexes
   */
  private async performTextSearch(query: string, indexes: SearchIndex[]): Promise<SearchIndex[]> {
    const queryTerms = this.tokenizeQuery(query);
    const results: Array<{ index: SearchIndex; score: number }> = [];

    for (const index of indexes) {
      const score = this.calculateTextMatchScore(queryTerms, index);
      if (score > 0) {
        results.push({ index, score });
      }
    }

    // Sort by text match score and return indexes
    return results
      .sort((a, b) => b.score - a.score)
      .map(result => result.index);
  }

  /**
   * Calculate relevance scores for search results
   */
  private async calculateRelevanceScores(query: string, indexes: SearchIndex[]): Promise<SearchResult[]> {
    const queryTerms = this.tokenizeQuery(query);
    const results: SearchResult[] = [];

    for (const index of indexes) {
      const textScore = this.calculateTextMatchScore(queryTerms, index);
      const titleBoost = this.calculateTitleBoost(queryTerms, index.title);
      const tagBoost = this.calculateTagBoost(queryTerms, index.tags);
      const recencyBoost = this.calculateRecencyBoost(index.updatedAt);

      const relevanceScore = Math.min(1.0, textScore + titleBoost + tagBoost + recencyBoost);

      if (relevanceScore > 0.1) { // Minimum threshold
        const matches = this.findMatches(queryTerms, index);
        const snippet = this.generateSnippet(index.content, queryTerms);

        results.push({
          id: index.id,
          entityId: index.entityId,
          entityType: index.entityType,
          title: index.title,
          excerpt: snippet,
          relevanceScore,
          metadata: {},
          highlightedText: snippet,
          createdAt: index.createdAt,
          updatedAt: index.updatedAt,
          snippet,
          matches,
          entity: null as any // Will be populated later
        });
      }
    }

    return results;
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sortBy: SearchSortField, sortOrder: 'asc' | 'desc'): SearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          // This would require entity data, for now use relevance
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        default:
          comparison = a.relevanceScore - b.relevanceScore;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Enrich results with actual entity data
   */
  private async enrichResultsWithEntities(results: SearchResult[]): Promise<SearchResult[]> {
    const enrichedResults: SearchResult[] = [];

    for (const result of results) {
      let entity: any = null;

      try {
        switch (result.entityType) {
          case 'case':
            entity = await db.cases.get(result.entityId);
            break;
          case 'inbox':
            entity = await db.inboxItems.get(result.entityId);
            break;
          case 'image':
            entity = await db.imageGallery.get(result.entityId);
            break;
        }

        if (entity) {
          enrichedResults.push({
            ...result,
            entity
          });
        }
      } catch (error) {
        // Skip entities that can't be loaded
        console.warn(`Failed to load entity ${result.entityId}:`, error);
      }
    }

    return enrichedResults;
  }

  /**
   * Generate search statistics
   */
  private generateSearchStats(results: SearchResult[], totalCount: number, startTime: number): SearchStats {
    const entityBreakdown: Record<SearchEntityType, number> = {
      case: 0,
      customer: 0,
      inbox: 0,
      image: 0,
      inbox_item: 0,
      hivemind_report: 0
    };

    let maxScore = 0;

    for (const result of results) {
      entityBreakdown[result.entityType]++;
      maxScore = Math.max(maxScore, result.relevanceScore);
    }

    return {
      totalResults: totalCount,
      searchTime: performance.now() - startTime,
      mostRelevantScore: maxScore,
      entityBreakdown,
      filterBreakdown: {} // TODO: Implement filter breakdown
    };
  }

  /**
   * Tokenize search query
   */
  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length >= this.MIN_QUERY_LENGTH && !this.stopWords.has(term));
  }

  /**
   * Calculate text match score
   */
  private calculateTextMatchScore(queryTerms: string[], index: SearchIndex): number {
    if (queryTerms.length === 0) return 0;

    const content = index.content.toLowerCase();
    let matches = 0;
    let totalTerms = queryTerms.length;

    for (const term of queryTerms) {
      if (content.includes(term)) {
        matches++;
      }
    }

    return matches / totalTerms * 0.6; // 60% weight for text matches
  }

  /**
   * Calculate title boost score
   */
  private calculateTitleBoost(queryTerms: string[], title: string): number {
    if (queryTerms.length === 0) return 0;

    const titleLower = title.toLowerCase();
    let matches = 0;

    for (const term of queryTerms) {
      if (titleLower.includes(term)) {
        matches++;
      }
    }

    return (matches / queryTerms.length) * 0.3; // 30% boost for title matches
  }

  /**
   * Calculate tag boost score
   */
  private calculateTagBoost(queryTerms: string[], tags: string[]): number {
    if (queryTerms.length === 0 || tags.length === 0) return 0;

    const tagText = tags.join(' ').toLowerCase();
    let matches = 0;

    for (const term of queryTerms) {
      if (tagText.includes(term)) {
        matches++;
      }
    }

    return (matches / queryTerms.length) * 0.1; // 10% boost for tag matches
  }

  /**
   * Calculate recency boost
   */
  private calculateRecencyBoost(updatedAt: Date): number {
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Boost recent items (within 30 days)
    if (daysSinceUpdate <= 30) {
      return (30 - daysSinceUpdate) / 30 * 0.05; // Up to 5% boost for recent items
    }

    return 0;
  }

  /**
   * Find specific matches in content
   */
  private findMatches(queryTerms: string[], index: SearchIndex): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const content = index.content.toLowerCase();

    for (const term of queryTerms) {
      const termIndex = content.indexOf(term);
      if (termIndex !== -1) {
        matches.push({
          field: 'content',
          text: term,
          startIndex: termIndex,
          endIndex: termIndex + term.length,
          type: 'exact'
        });
      }
    }

    return matches;
  }

  /**
   * Generate content snippet with highlighted matches
   */
  private generateSnippet(content: string, queryTerms: string[]): string {
    if (content.length <= this.SNIPPET_LENGTH) {
      return content;
    }

    // Find the best position for snippet based on query matches
    const contentLower = content.toLowerCase();
    let bestPosition = 0;
    let maxMatches = 0;

    // Sliding window to find section with most matches
    for (let i = 0; i <= content.length - this.SNIPPET_LENGTH; i += 10) {
      const section = contentLower.substring(i, i + this.SNIPPET_LENGTH);
      let matches = 0;

      for (const term of queryTerms) {
        if (section.includes(term)) matches++;
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        bestPosition = i;
      }
    }

    let snippet = content.substring(bestPosition, bestPosition + this.SNIPPET_LENGTH);
    
    // Add ellipsis if not at start/end
    if (bestPosition > 0) snippet = '...' + snippet;
    if (bestPosition + this.SNIPPET_LENGTH < content.length) snippet += '...';

    return snippet.trim();
  }

  /**
   * Get autocomplete suggestions
   */
  private async getAutocompleteSuggestions(partialQuery: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    
    try {
      // Get unique words from search index that start with partial query
      const indexes = await db.searchIndex.toArray();
      const wordSet = new Set<string>();

      for (const index of indexes) {
        const words = this.tokenizeQuery(index.content + ' ' + index.title);
        for (const word of words) {
          if (word.startsWith(partialQuery) && word.length > partialQuery.length) {
            wordSet.add(word);
          }
        }
      }

      // Convert to suggestions
      Array.from(wordSet).slice(0, 5).forEach(word => {
        suggestions.push({
          text: word,
          type: 'autocomplete'
        });
      });
    } catch (error) {
      console.warn('Failed to get autocomplete suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Get recent search suggestions
   */
  private async getRecentSearchSuggestions(_partialQuery: string): Promise<SearchSuggestion[]> {
    // TODO: Implement search history tracking
    return [];
  }

  /**
   * Get popular search suggestions
   */
  private async getPopularSearchSuggestions(_partialQuery: string): Promise<SearchSuggestion[]> {
    // TODO: Implement search analytics tracking
    return [];
  }

  /**
   * Remove duplicate suggestions
   */
  private deduplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    const unique: SearchSuggestion[] = [];

    for (const suggestion of suggestions) {
      if (!seen.has(suggestion.text)) {
        seen.add(suggestion.text);
        unique.push(suggestion);
      }
    }

    return unique;
  }
}

// Export singleton instance
export const searchService = new SearchService();