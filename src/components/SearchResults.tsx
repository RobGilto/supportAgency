import React, { useState } from 'react';
import { SearchResult, SearchStats, SearchEntityType } from '@/types';

interface SearchResultsProps {
  results: SearchResult[];
  stats: SearchStats;
  isLoading?: boolean;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  stats,
  isLoading = false,
  onResultClick,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [filterBy, setFilterBy] = useState<SearchEntityType | 'all'>('all');

  // Filter results by entity type
  const filteredResults = filterBy === 'all' 
    ? results 
    : results.filter(result => result.entityType === filterBy);

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        return b.relevanceScore - a.relevanceScore;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'date':
        // For now, use relevance as fallback
        return b.relevanceScore - a.relevanceScore;
      default:
        return 0;
    }
  });

  const formatSearchTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getEntityIcon = (entityType: SearchEntityType): string => {
    switch (entityType) {
      case 'case': return '📋';
      case 'inbox': return '📥';
      case 'image': return '🖼️';
      default: return '📄';
    }
  };

  const getEntityLabel = (entityType: SearchEntityType): string => {
    switch (entityType) {
      case 'case': return 'Case';
      case 'inbox': return 'Inbox';
      case 'image': return 'Image';
      default: return 'Unknown';
    }
  };

  const highlightSnippet = (snippet: string, matches: SearchResult['matches']): React.ReactNode => {
    if (!matches.length) return snippet;

    // For now, return snippet as-is. In a full implementation, we'd highlight matches
    return (
      <span dangerouslySetInnerHTML={{
        __html: snippet.replace(/\b(error|login|authentication|dashboard|bug|issue|problem)\b/gi, 
          '<mark class="bg-yellow-200">$1</mark>')
      }} />
    );
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Searching...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search stats and controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{stats.totalResults}</span> results found in{' '}
            <span className="font-medium">{formatSearchTime(stats.searchTime)}</span>
            {stats.mostRelevantScore > 0 && (
              <span className="ml-2">
                • Best match: <span className="font-medium">{Math.round(stats.mostRelevantScore * 100)}%</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="relevance">Sort by relevance</option>
              <option value="title">Sort by title</option>
              <option value="date">Sort by date</option>
            </select>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All types</option>
              <option value="case">Cases only</option>
              <option value="inbox">Inbox only</option>
              <option value="image">Images only</option>
            </select>
          </div>
        </div>

        {/* Entity type breakdown */}
        {Object.keys(stats.entityBreakdown).length > 0 && (
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {Object.entries(stats.entityBreakdown).map(([type, count]) => (
              count > 0 && (
                <div key={type} className="flex items-center space-x-1">
                  <span>{getEntityIcon(type as SearchEntityType)}</span>
                  <span>{count} {getEntityLabel(type as SearchEntityType).toLowerCase()}(s)</span>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Search results */}
      <div className="space-y-4">
        {sortedResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">
              {results.length === 0 
                ? "Try adjusting your search terms or filters" 
                : "Try changing the filter settings"}
            </p>
          </div>
        ) : (
          sortedResults.map((result) => (
            <div
              key={result.id}
              onClick={() => onResultClick?.(result)}
              className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                onResultClick ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getEntityIcon(result.entityType)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{result.title}</h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="capitalize">{getEntityLabel(result.entityType)}</span>
                      <span>•</span>
                      <span>{Math.round(result.relevanceScore * 100)}% relevance</span>
                      {result.matches.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{result.matches.length} match(es)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    result.relevanceScore >= 0.8 
                      ? 'bg-green-100 text-green-800'
                      : result.relevanceScore >= 0.6 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {Math.round(result.relevanceScore * 100)}%
                  </div>
                </div>
              </div>

              {/* Snippet */}
              {result.snippet && (
                <div className="text-sm text-gray-600 mb-3">
                  {highlightSnippet(result.snippet, result.matches)}
                </div>
              )}

              {/* Matches */}
              {result.matches.length > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500">Matches:</span>
                  <div className="flex items-center space-x-1">
                    {result.matches.slice(0, 3).map((match, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded ${
                          match.type === 'exact' 
                            ? 'bg-green-100 text-green-700'
                            : match.type === 'semantic' 
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {match.text} ({match.type})
                      </span>
                    ))}
                    {result.matches.length > 3 && (
                      <span className="text-gray-500">
                        +{result.matches.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Entity-specific information */}
              {result.entity && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {result.entityType === 'case' && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Case #{(result.entity as any).caseNumber}</span>
                      <span>Status: {(result.entity as any).status}</span>
                      <span>Priority: {(result.entity as any).priority}</span>
                      <span>Classification: {(result.entity as any).classification}</span>
                    </div>
                  )}
                  
                  {result.entityType === 'inbox' && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Type: {(result.entity as any).contentType}</span>
                      <span>Status: {(result.entity as any).status}</span>
                      {(result.entity as any).tags && (result.entity as any).tags.length > 0 && (
                        <span>Tags: {(result.entity as any).tags.slice(0, 3).join(', ')}</span>
                      )}
                    </div>
                  )}
                  
                  {result.entityType === 'image' && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Format: {(result.entity as any).originalFormat}</span>
                      <span>Size: {Math.round((result.entity as any).fileSize / 1024)}KB</span>
                      <span>Dimensions: {(result.entity as any).width}×{(result.entity as any).height}</span>
                      {(result.entity as any).tags && (result.entity as any).tags.length > 0 && (
                        <span>Tags: {(result.entity as any).tags.slice(0, 3).join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load more button */}
      {sortedResults.length > 0 && sortedResults.length < stats.totalResults && (
        <div className="text-center mt-8">
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Load more results ({stats.totalResults - sortedResults.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;