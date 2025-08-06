import React, { useState, useEffect } from 'react';
import { caseRepository } from '@/services/repositories/CaseRepository';
import { db } from '@/services/database';

const DatabaseTestPage: React.FC = () => {
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  useEffect(() => {
    // Load database stats on component mount
    loadDbStats();
  }, []);

  const loadDbStats = async () => {
    try {
      const stats = await db.getStats();
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to load DB stats:', error);
    }
  };

  const runDatabaseTest = async () => {
    setIsTestRunning(true);
    setTestResults([]);
    const results: string[] = [];

    try {
      results.push('🧪 Starting database tests...');

      // Test 1: Create a case
      results.push('📝 Creating test case...');
      const createResult = await caseRepository.createCase({
        title: 'Manual UI Test Case',
        description: 'Testing database from the UI interface',
        status: 'pending',
        priority: 'medium',
        classification: 'query',
        tags: ['ui-test', 'manual'],
        artifacts: [],
        customerName: 'Test Customer'
      });

      if (createResult.success) {
        results.push(`✅ Case created: ${createResult.data.caseNumber}`);
        
        // Test 2: Find the case
        const findResult = await caseRepository.findByCaseNumber(createResult.data.caseNumber);
        if (findResult.success) {
          results.push('✅ Case found by case number');
        } else {
          results.push('❌ Failed to find case by case number');
        }

        // Test 3: Update case status
        const updateResult = await caseRepository.updateStatus(createResult.data.id, 'in_progress');
        if (updateResult.success) {
          results.push('✅ Case status updated to in_progress');
        } else {
          results.push('❌ Failed to update case status');
        }

        // Test 4: Add tags
        const tagResult = await caseRepository.addTags(createResult.data.id, ['database', 'test']);
        if (tagResult.success) {
          results.push('✅ Tags added to case');
        } else {
          results.push('❌ Failed to add tags');
        }

        // Test 5: Get statistics
        const statsResult = await caseRepository.getStatistics();
        if (statsResult.success) {
          results.push(`📊 Statistics: ${statsResult.data.total} total cases`);
        } else {
          results.push('❌ Failed to get statistics');
        }

        // Clean up: Delete test case
        const deleteResult = await caseRepository.delete(createResult.data.id);
        if (deleteResult.success) {
          results.push('🧹 Test case cleaned up');
        } else {
          results.push('⚠️ Failed to clean up test case');
        }
      } else {
        results.push(`❌ Case creation failed: ${createResult.error.message}`);
      }

      results.push('🎉 Database test completed!');
    } catch (error) {
      results.push(`💥 Test failed with exception: ${error}`);
    }

    setTestResults(results);
    setIsTestRunning(false);
    
    // Refresh stats after test
    await loadDbStats();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Database Testing</h1>
        <p className="text-gray-600 mt-1">Test IndexedDB schema and repository operations</p>
      </div>

      <div className="grid gap-6">
        {/* Database Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-3">📊 Database Statistics</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(dbStats).map(([tableName, count]) => (
              <div key={tableName} className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-500">{tableName}</div>
                <div className="text-lg font-semibold">{count} records</div>
              </div>
            ))}
          </div>
          <button
            onClick={loadDbStats}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Stats
          </button>
        </div>

        {/* Test Runner */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-3">🧪 Repository Tests</h2>
          <button
            onClick={runDatabaseTest}
            disabled={isTestRunning}
            className={`px-6 py-3 rounded font-medium ${
              isTestRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isTestRunning ? 'Running Tests...' : 'Run Database Test'}
          </button>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="font-mono text-sm space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className={`${
                    result.includes('✅') ? 'text-green-600' : 
                    result.includes('❌') || result.includes('💥') ? 'text-red-600' : 
                    result.includes('📊') ? 'text-blue-600' :
                    'text-gray-700'
                  }`}>
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manual Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">
            💡 Manual Testing Instructions
          </h2>
          <div className="text-blue-700 space-y-2">
            <p><strong>Browser Console:</strong> Press F12 → Console tab, then run:</p>
            <code className="block bg-white p-2 rounded text-sm">
              {`import('./src/utils/test-repository').then(m => m.runAllTests())`}
            </code>
            <p><strong>IndexedDB Inspection:</strong> F12 → Application → Storage → IndexedDB → SmartSupportDatabase</p>
            <p><strong>Network Tab:</strong> Check for any errors during database operations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTestPage;