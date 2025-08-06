import React, { useState } from 'react';
import { PasteEvent, PasteAction } from '@/types';

interface PasteAnalysisCardProps {
  pasteEvent: PasteEvent;
  onActionSelect: (action: PasteAction) => void;
  onDismiss: () => void;
  className?: string;
}

const PasteAnalysisCard: React.FC<PasteAnalysisCardProps> = ({
  pasteEvent,
  onActionSelect,
  onDismiss,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getContentTypeIcon = (contentType: string): string => {
    switch (contentType) {
      case 'support_request': return '🎫';
      case 'console_log': return '🔧';
      case 'url_link': return '🔗';
      case 'image': return '🖼️';
      case 'mixed_content': return '📦';
      default: return '📄';
    }
  };

  const getContentTypeLabel = (contentType: string): string => {
    switch (contentType) {
      case 'support_request': return 'Support Request';
      case 'console_log': return 'Console Log';
      case 'url_link': return 'URL Link';
      case 'image': return 'Image';
      case 'mixed_content': return 'Mixed Content';
      default: return 'Plain Text';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  const truncateContent = (content: string, maxLength: number = 150): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getContentTypeIcon(pasteEvent.contentType)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {getContentTypeLabel(pasteEvent.contentType)}
            </h3>
            <p className="text-xs text-gray-500">
              Detected {new Date(pasteEvent.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Confidence Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(pasteEvent.confidence)}`}>
            {formatConfidence(pasteEvent.confidence)}
          </span>
          
          {/* Dismiss Button */}
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <div className="bg-gray-50 rounded-md p-3 text-sm">
          <p className="text-gray-700">
            {isExpanded ? pasteEvent.content : truncateContent(pasteEvent.content)}
          </p>
          {pasteEvent.content.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 text-xs mt-2"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      {pasteEvent.metadata && Object.keys(pasteEvent.metadata).length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Extracted Information</h4>
          <div className="space-y-1 text-sm">
            {pasteEvent.metadata.urls && pasteEvent.metadata.urls.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🔗</span>
                <span className="text-gray-600">
                  {pasteEvent.metadata.urls.length} URL(s) found
                </span>
              </div>
            )}
            
            {pasteEvent.metadata.consoleErrors && pasteEvent.metadata.consoleErrors.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <span className="text-gray-600">
                  {pasteEvent.metadata.consoleErrors.length} error(s) detected
                </span>
              </div>
            )}
            
            {pasteEvent.metadata.customerInfo && (
              <div className="flex items-center space-x-2">
                <span className="text-purple-600">👤</span>
                <span className="text-gray-600">
                  Customer info: {pasteEvent.metadata.customerInfo.name || pasteEvent.metadata.customerInfo.email}
                </span>
              </div>
            )}
            
            {pasteEvent.metadata.urgencyLevel && pasteEvent.metadata.urgencyLevel !== 'medium' && (
              <div className="flex items-center space-x-2">
                <span className={
                  pasteEvent.metadata.urgencyLevel === 'critical' ? 'text-red-600' :
                  pasteEvent.metadata.urgencyLevel === 'high' ? 'text-orange-600' :
                  'text-blue-600'
                }>
                  {pasteEvent.metadata.urgencyLevel === 'critical' ? '🚨' :
                   pasteEvent.metadata.urgencyLevel === 'high' ? '⚠️' : 'ℹ️'}
                </span>
                <span className="text-gray-600">
                  {pasteEvent.metadata.urgencyLevel} priority
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      <div>
        <h4 className="font-medium text-sm text-gray-700 mb-2">Suggested Actions</h4>
        <div className="space-y-2">
          {pasteEvent.suggestedActions.slice(0, 3).map((action) => (
            <button
              key={action.id}
              onClick={() => onActionSelect(action)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 border-dashed transition-colors ${
                action.confidence > 0.7
                  ? 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                  : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-sm text-gray-900">
                  {action.label}
                </div>
                <div className="text-xs text-gray-500">
                  {action.description}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(action.confidence)}`}>
                  {formatConfidence(action.confidence)}
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </button>
          ))}
        </div>
        
        {pasteEvent.suggestedActions.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 mt-2 py-1"
          >
            {isExpanded ? 'Show fewer actions' : `Show ${pasteEvent.suggestedActions.length - 3} more actions`}
          </button>
        )}
      </div>
    </div>
  );
};

export default PasteAnalysisCard;