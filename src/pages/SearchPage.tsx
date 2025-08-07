import React, { useState, useEffect } from 'react';
import AdvancedSearch from '@/components/AdvancedSearch';
import SearchResults from '@/components/SearchResults';
import { SearchResult, SearchStats, SavedSearch } from '@/types';
import { searchService } from '@/services/searchService';
import { savedSearchRepository } from '@/services/repositories/SavedSearchRepository';

const SearchPage: React.FC = () => {
  // Search state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<SearchStats>({
    totalResults: 0,
    searchTime: 0,
    mostRelevantScore: 0,
    entityBreakdown: { case: 0, inbox: 0, image: 0 },
    filterBreakdown: {}
  });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showRecentSearches, setShowRecentSearches] = useState(true);
  const [recentSearches, setRecentSearches] = useState<SavedSearch[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);

  useEffect(() => {
    loadRecentSearches();
    loadSearchStats();
    // Auto-rebuild search index on first load
    rebuildSearchIndex();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const result = await savedSearchRepository.getRecentSearches(5);
      if (result.success) {
        setRecentSearches(result.data);
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  };

  const loadSearchStats = async () => {
    try {
      const result = await savedSearchRepository.getStatistics();
      if (result.success) {
        setSearchStats(result.data);
      }
    } catch (error) {
      console.warn('Failed to load search statistics:', error);
    }
  };

  const rebuildSearchIndex = async () => {
    try {
      console.log('Rebuilding search index...');
      const result = await searchService.rebuildSearchIndex();
      if (result.success) {
        console.log(`Search index rebuilt: ${result.data.indexed} indexed, ${result.data.skipped} skipped`);
      }
    } catch (error) {
      console.warn('Failed to rebuild search index:', error);
    }
  };

  const handleSearchResults = (searchResults: SearchResult[], searchStats: SearchStats) => {
    setResults(searchResults);
    setStats(searchStats);
    setError(null);
    setShowRecentSearches(false);
  };

  const handleSearchError = (errorMessage: string) => {
    setError(errorMessage);
    setResults([]);
    setStats({
      totalResults: 0,
      searchTime: 0,
      mostRelevantScore: 0,
      entityBreakdown: { case: 0, inbox: 0, image: 0 },
      filterBreakdown: {}
    });
  };

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate page based on entity type
    switch (result.entityType) {
      case 'case':
        // TODO: Navigate to case details
        console.log('Navigate to case:', result.entityId);
        break;
      case 'inbox':
        // TODO: Navigate to inbox item
        console.log('Navigate to inbox item:', result.entityId);
        break;
      case 'image':
        // TODO: Navigate to image gallery
        console.log('Navigate to image:', result.entityId);
        break;
    }
  };

  const clearSearch = () => {
    setResults([]);
    setStats({
      totalResults: 0,
      searchTime: 0,
      mostRelevantScore: 0,
      entityBreakdown: { case: 0, inbox: 0, image: 0 },
      filterBreakdown: {}
    });
    setError(null);
    setShowRecentSearches(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
        <p className="text-gray-600">
          Search across all cases, files, and content with advanced filtering and intelligent suggestions.
        </p>
      </div>

      {/* Search interface */}
      <div className="mb-8">
        <AdvancedSearch
          onResults={handleSearchResults}
          onError={handleSearchError}
          autoFocus
          showFilters
          showSavedSearches
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="font-medium text-red-800">Search Error</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome screen / recent searches */}
      {showRecentSearches && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent searches */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">📚</span>
              Recent Saved Searches
            </h2>
            
            {recentSearches.length > 0 ? (
              <div className="space-y-3">
                {recentSearches.map((search) => (
                  <div
                    key={search.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      // TODO: Execute saved search
                      console.log('Execute saved search:', search);
                    }}
                  >
                    <div className="font-medium text-gray-900">{search.name}</div>
                    <div className="text-sm text-gray-600 truncate">
                      {search.query || 'No query text'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.keys(search.filters).length} filters • Created {search.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={loadRecentSearches}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
                >
                  Refresh saved searches
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-3">📝</div>
                <p>No saved searches yet</p>
                <p className="text-sm mt-2">Save your searches for quick access later</p>
              </div>
            )}
          </div>

          {/* Search tips and statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">💡</span>
              Search Tips & Statistics
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Quick Tips:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use quotes for exact phrases: "login error"</li>
                  <li>• Combine filters for precise results</li>
                  <li>• Save complex searches for future use</li>
                  <li>• Search works across cases, inbox, and images</li>
                </ul>
              </div>

              {searchStats && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Your Search Activity:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Saved searches:</span>
                      <span className="font-medium">{searchStats.totalSavedSearches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg. complexity:</span>
                      <span className="font-medium">{Math.round(searchStats.averageSearchComplexity * 100)}%</span>
                    </div>
                    {searchStats.mostUsedFilters.length > 0 && (
                      <div>
                        <span>Most used filter:</span>
                        <span className="font-medium ml-1">
                          {searchStats.mostUsedFilters[0].filter} ({searchStats.mostUsedFilters[0].count}×)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={rebuildSearchIndex}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  🔄 Rebuild Search Index
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Refresh search index to include recent changes
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search results */}
      {!showRecentSearches && !error && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
            <button
              onClick={clearSearch}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back to search
            </button>
          </div>
          
          <SearchResults
            results={results}
            stats={stats}
            isLoading={isSearching}
            onResultClick={handleResultClick}
          />
        </div>
      )}

      {/* Search performance info */}
      {stats.totalResults > 0 && (
        <div className="mt-12 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">🚀 Search Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-600 font-medium">{stats.totalResults}</div>
              <div className="text-blue-700">Total Results</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">{stats.searchTime.toFixed(0)}ms</div>
              <div className="text-blue-700">Search Time</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">{Math.round(stats.mostRelevantScore * 100)}%</div>
              <div className="text-blue-700">Best Match</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">
                {Object.values(stats.entityBreakdown).reduce((a, b) => a + (b > 0 ? 1 : 0), 0)}
              </div>
              <div className="text-blue-700">Entity Types</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;