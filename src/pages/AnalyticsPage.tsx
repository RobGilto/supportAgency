import React from 'react';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">View insights and patterns from case data</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📊</div>
          <p>Analytics dashboard will be implemented in Story 11</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;