import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CasesPage from '@/pages/CasesPage';
import InboxPage from '@/pages/InboxPage';
import ImageGalleryPage from '@/pages/ImageGalleryPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import SettingsPage from '@/pages/SettingsPage';
import DatabaseTestPage from '@/pages/DatabaseTestPage';

function App(): React.ReactElement {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Default route redirects to cases */}
          <Route index element={<Navigate to="/cases" replace />} />
          
          {/* Main application routes */}
          <Route path="cases" element={<CasesPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="gallery" element={<ImageGalleryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="test" element={<DatabaseTestPage />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/cases" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;