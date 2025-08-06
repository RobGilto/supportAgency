import React, { useCallback } from 'react';
import { PasteEvent, PasteAction } from '@/types';
import { usePasteStore } from '@/stores/pasteStore';
import PasteArea from '@/components/PasteArea';

const InboxPage: React.FC = () => {
  const { 
    recentPastes, 
    isProcessingAction, 
    error,
    executeAction,
    addPasteEvent,
    clearRecentPastes,
    setError
  } = usePasteStore();

  const handlePasteDetected = useCallback((pasteEvent: PasteEvent) => {
    addPasteEvent(pasteEvent);
  }, [addPasteEvent]);

  const handleActionSelect = useCallback(async (action: PasteAction, pasteEvent: PasteEvent) => {
    const result = await executeAction(action, pasteEvent);
    
    if (result.success) {
      // Show success notification
      if (action.type === 'create_case') {
        console.log('Case created successfully:', result.data);
      } else if (action.type === 'add_to_inbox') {
        console.log('Added to inbox successfully:', result.data);
      }
    }
  }, [executeAction]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-gray-600 mt-1">Paste content here to analyze and automatically categorize</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Paste Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Smart Paste Tool</h2>
            <PasteArea
              onPasteDetected={handlePasteDetected}
              onActionSelect={handleActionSelect}
              placeholder="Paste support content, console logs, URLs, or any text here for intelligent analysis..."
            />
            
            {isProcessingAction && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700">Processing action...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Pastes Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Analysis</h2>
              {recentPastes.length > 0 && (
                <button
                  onClick={clearRecentPastes}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {recentPastes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-3xl mb-2">🕐</div>
                <p className="text-sm">No recent pastes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPastes.slice(0, 5).map((paste) => (
                  <div key={paste.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {paste.contentType.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(paste.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {paste.content.substring(0, 60)}...
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(paste.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 How it works</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Paste any content using Ctrl+V</p>
              <p>• AI analyzes content type and intent</p>
              <p>• Get intelligent suggestions for actions</p>
              <p>• Automatically create cases or save to inbox</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Content Types */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🎯 Supported Content Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🎫</div>
            <div className="font-medium">Support Requests</div>
            <div className="text-sm text-gray-600">Customer issues and problem descriptions</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🔧</div>
            <div className="font-medium">Console Logs</div>
            <div className="text-sm text-gray-600">Browser errors and debugging information</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🔗</div>
            <div className="font-medium">URLs & Links</div>
            <div className="text-sm text-gray-600">Shared links with metadata extraction</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;