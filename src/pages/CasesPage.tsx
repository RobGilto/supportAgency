import React from 'react';

const CasesPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
        <p className="text-gray-600 mt-1">Manage support cases and customer issues</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📋</div>
          <p>Case management interface will be implemented in Story 7</p>
        </div>
      </div>
    </div>
  );
};

export default CasesPage;