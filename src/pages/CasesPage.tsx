import React, { useCallback, useState } from 'react';
import { PasteEvent, PasteAction } from '@/types';
import { usePasteStore } from '@/stores/pasteStore';
import PasteArea from '@/components/PasteArea';

const CasesPage: React.FC = () => {
  const { executeAction } = usePasteStore();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleActionSelect = useCallback(async (action: PasteAction, pasteEvent: PasteEvent) => {
    const result = await executeAction(action, pasteEvent);
    
    if (result.success && action.type === 'create_case') {
      setSuccessMessage(`Case created successfully: ${result.data.caseNumber}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [executeAction]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
        <p className="text-gray-600 mt-1">Manage support cases and customer issues</p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-green-700">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Cases Area */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📋</div>
              <p className="mb-4">Full case management interface will be implemented in Story 7</p>
              <div className="text-sm text-gray-400">
                For now, you can create cases by pasting content in the Quick Create area →
              </div>
            </div>
          </div>
        </div>

        {/* Quick Case Creation */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">⚡ Quick Create</h2>
            <PasteArea
              onActionSelect={handleActionSelect}
              placeholder="Paste support content here to quickly create a case..."
              className="min-h-24"
              showAnalysisCard={true}
            />
          </div>

          {/* Case Creation Tips */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Case Creation Tips</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Paste customer emails or messages</p>
              <p>• Include console errors for technical cases</p>
              <p>• URLs are automatically extracted</p>
              <p>• Priority is set based on urgency keywords</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasesPage;