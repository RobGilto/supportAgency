import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SearchQuery, 
  SearchResult, 
  SearchSuggestion, 
  SearchStats,
  SearchFilters,
  SavedSearch,
  CaseStatus,
  CasePriority,
  CaseClassification,
  DateRange
} from '@/types';
import { searchService } from '@/services/searchService';
import { savedSearchRepository } from '@/services/repositories/SavedSearchRepository';

interface AdvancedSearchProps {
  onResults: (results: SearchResult[], stats: SearchStats) => void;
  onError: (error: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showFilters?: boolean;
  showSavedSearches?: boolean;
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onResults,
  onError,
  placeholder = "Search cases, files, and content...",
  autoFocus = false,
  showFilters = true,
  showSavedSearches = true,
  className = ''
}) => {
  // Search state
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSavedSearches, setShowSavedSearchesPanel] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load saved searches on mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSavedSearches = async () => {
    try {
      const result = await savedSearchRepository.getRecentSearches(10);
      if (result.success) {
        setSavedSearches(result.data);
      }
    } catch (error) {
      console.warn('Failed to load saved searches:', error);
    }
  };

  const handleSearch = useCallback(async (searchQuery: string = query, searchFilters: SearchFilters = filters) => {
    if (!searchQuery.trim() && Object.keys(searchFilters).length === 0) {
      onResults([], {
        totalResults: 0,
        searchTime: 0,
        mostRelevantScore: 0,
        entityBreakdown: { case: 0, inbox: 0, image: 0 },
        filterBreakdown: {}
      });
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const searchParams: SearchQuery = {
        text: searchQuery.trim() || undefined,
        filters: Object.keys(searchFilters).length > 0 ? searchFilters : undefined,
        sortBy: 'relevance',
        sortOrder: 'desc',
        limit: 50
      };

      const result = await searchService.search(searchParams);
      
      if (result.success) {
        onResults(result.data.results, result.data.stats);
      } else {
        onError(result.error.message);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, onResults, onError]);

  const handleQueryChange = useCallback(async (value: string) => {
    setQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Get suggestions for non-empty queries
    if (value.length >= 2) {
      try {
        const suggestionsResult = await searchService.getSuggestions(value);
        if (suggestionsResult.success) {
          setSuggestions(suggestionsResult.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.warn('Failed to get suggestions:', error);
      }

      // Debounced search
      searchTimeoutRef.current = setTimeout(() => {
        if (value.length >= 3) {
          handleSearch(value, filters);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [filters, handleSearch]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    handleSearch(suggestion.text, filters);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    handleSearch(query, newFilters);
  };

  const handleSavedSearchSelect = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setShowSavedSearchesPanel(false);
    handleSearch(savedSearch.query, savedSearch.filters);
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) return;

    try {
      const result = await searchService.saveSearch(saveSearchName, { text: query, filters });
      if (result.success) {
        setSaveSearchName('');
        setShowSaveDialog(false);
        loadSavedSearches();
      } else {
        onError('Failed to save search: ' + result.error.message);
      }
    } catch (error) {
      onError('Failed to save search: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearSearch = () => {
    setQuery('');
    setFilters({});
    setShowSuggestions(false);
    onResults([], {
      totalResults: 0,
      searchTime: 0,
      mostRelevantScore: 0,
      entityBreakdown: { case: 0, inbox: 0, image: 0 },
      filterBreakdown: {}
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main search bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isSearching}
          />
          
          <div className="absolute right-2 flex items-center space-x-1">
            {query && (
              <button
                onClick={clearSearch}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Clear search"
              >
                <span className="text-lg">✕</span>
              </button>
            )}
            
            {showFilters && (
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-1 rounded ${
                  showAdvancedFilters || Object.keys(filters).length > 0
                    ? 'text-blue-600 bg-blue-100'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Advanced filters"
              >
                <span className="text-lg">🔍</span>
              </button>
            )}
            
            {showSavedSearches && (
              <button
                onClick={() => setShowSavedSearchesPanel(!showSavedSearches)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Saved searches"
              >
                <span className="text-lg">📚</span>
              </button>
            )}

            <button
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50"
          >
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                >
                  <span className="text-sm text-gray-800">{suggestion.text}</span>
                  <span className="text-xs text-gray-500 capitalize">{suggestion.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FilterSelect
              label="Status"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' }
              ]}
              value={filters.status || []}
              onChange={(values) => handleFilterChange({ ...filters, status: values as CaseStatus[] })}
              multiple
            />

            <FilterSelect
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' }
              ]}
              value={filters.priority || []}
              onChange={(values) => handleFilterChange({ ...filters, priority: values as CasePriority[] })}
              multiple
            />

            <FilterSelect
              label="Classification"
              options={[
                { value: 'general', label: 'General' },
                { value: 'technical', label: 'Technical' },
                { value: 'bug', label: 'Bug' },
                { value: 'feature', label: 'Feature' },
                { value: 'urgent', label: 'Urgent' }
              ]}
              value={filters.classification || []}
              onChange={(values) => handleFilterChange({ ...filters, classification: values as CaseClassification[] })}
              multiple
            />
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={!query && Object.keys(filters).length === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                💾 Save Search
              </button>
              
              <button
                onClick={() => handleFilterChange({})}
                disabled={Object.keys(filters).length === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Clear Filters
              </button>
            </div>

            <div className="text-xs text-gray-500">
              {Object.keys(filters).length} filter(s) active
            </div>
          </div>
        </div>
      )}

      {/* Saved searches panel */}
      {showSavedSearches && savedSearches.length > 0 && (
        <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Saved Searches</h3>
          <div className="space-y-2">
            {savedSearches.slice(0, 5).map((savedSearch) => (
              <button
                key={savedSearch.id}
                onClick={() => handleSavedSearchSelect(savedSearch)}
                className="w-full text-left p-2 rounded hover:bg-gray-200 border border-gray-300"
              >
                <div className="font-medium text-sm text-gray-800">{savedSearch.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {savedSearch.query || 'No query text'} • {Object.keys(savedSearch.filters).length} filters
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save search dialog */}
      {showSaveDialog && (
        <div className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Save Current Search</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="Enter search name..."
              className="flex-1 px-3 py-2 border border-blue-300 rounded text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
            />
            <button
              onClick={handleSaveSearch}
              disabled={!saveSearchName.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-3 py-2 border border-blue-300 text-blue-600 rounded text-sm hover:bg-blue-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  options,
  value,
  onChange,
  multiple = false
}) => {
  const handleChange = (optionValue: string) => {
    if (multiple) {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    } else {
      onChange(value.includes(optionValue) ? [] : [optionValue]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {options.map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => handleChange(option.value)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default AdvancedSearch;