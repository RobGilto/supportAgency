import React from 'react';

const InboxPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-gray-600 mt-1">Review unprocessed content and categorization results</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📥</div>
          <p>Inbox functionality will be implemented in Story 5</p>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;