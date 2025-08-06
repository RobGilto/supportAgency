import React, { useState, useCallback } from 'react';
import { PasteEvent, PasteAction } from '@/types';
import { usePasteArea } from '@/hooks/usePaste';
import PasteAnalysisCard from './PasteAnalysisCard';

interface PasteAreaProps {
  onActionSelect?: (action: PasteAction, pasteEvent: PasteEvent) => void;
  onPasteDetected?: (pasteEvent: PasteEvent) => void;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
  showAnalysisCard?: boolean;
}

const PasteArea: React.FC<PasteAreaProps> = ({
  onActionSelect,
  onPasteDetected,
  placeholder = "Paste content here (Ctrl+V) to analyze and get intelligent suggestions...",
  className = '',
  children,
  showAnalysisCard = true
}) => {
  const [currentPasteEvent, setCurrentPasteEvent] = useState<PasteEvent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaste = useCallback(async (pasteEvent: PasteEvent) => {
    setIsProcessing(true);
    setCurrentPasteEvent(pasteEvent);
    
    // Notify parent of paste detection
    if (onPasteDetected) {
      onPasteDetected(pasteEvent);
    }
    
    setIsProcessing(false);
  }, [onPasteDetected]);

  const handleError = useCallback((error: Error) => {
    console.error('Paste error:', error);
    setIsProcessing(false);
  }, []);

  const { ref, isSupported, isReady, requestPermission } = usePasteArea({
    enabled: true,
    onPaste: handlePaste,
    onError: handleError
  });

  const handleActionSelect = useCallback((action: PasteAction) => {
    if (currentPasteEvent && onActionSelect) {
      onActionSelect(action, currentPasteEvent);
    }
    // Keep the analysis card visible for now - let parent handle dismissal
  }, [currentPasteEvent, onActionSelect]);

  const handleDismiss = useCallback(() => {
    setCurrentPasteEvent(null);
  }, []);

  const handleManualPaste = useCallback(async () => {
    if (!isReady) {
      await requestPermission();
      return;
    }

    setIsProcessing(true);
    // The paste hook will automatically detect and process clipboard content
    setIsProcessing(false);
  }, [isReady, requestPermission]);

  if (!isSupported) {
    return (
      <div className={`p-6 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-yellow-600 mb-2">⚠️</div>
          <p className="text-yellow-800">
            Clipboard functionality is not supported in this browser.
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            Please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main paste area */}
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={`
          min-h-32 p-6 border-2 border-dashed rounded-lg transition-all duration-200
          ${isReady 
            ? 'border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50' 
            : 'border-gray-300 bg-gray-50'
          }
          ${isProcessing ? 'opacity-50' : ''}
        `}
      >
        {children || (
          <div className="text-center">
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-blue-600">Analyzing content...</span>
              </div>
            ) : isReady ? (
              <div>
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600 mb-4">{placeholder}</p>
                <button
                  onClick={handleManualPaste}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Analyze Clipboard
                </button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">🔒</div>
                <p className="text-gray-600 mb-4">
                  Clipboard access is needed to analyze pasted content.
                </p>
                <button
                  onClick={requestPermission}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enable Clipboard Access
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analysis Card */}
      {showAnalysisCard && currentPasteEvent && (
        <div className="mt-4">
          <PasteAnalysisCard
            pasteEvent={currentPasteEvent}
            onActionSelect={handleActionSelect}
            onDismiss={handleDismiss}
          />
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {isReady && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          💡 Tip: You can paste directly with Ctrl+V (Cmd+V on Mac) when this area is focused
        </div>
      )}
    </div>
  );
};

export default PasteArea;