import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, toggleTerminal, isTerminalVisible } = useAppStore();

  const navigationItems = [
    { path: '/cases', name: 'Cases', icon: '📋', description: 'Manage support cases' },
    { path: '/inbox', name: 'Inbox', icon: '📥', description: 'Process new content' },
    { path: '/gallery', name: 'Gallery', icon: '🖼️', description: 'Image management' },
    { path: '/search', name: 'Search', icon: '🔍', description: 'Advanced search & filtering' },
    { path: '/analytics', name: 'Analytics', icon: '📊', description: 'Insights & reports' },
    { path: '/settings', name: 'Settings', icon: '⚙️', description: 'App preferences' },
    { path: '/test', name: 'DB Test', icon: '🧪', description: 'Database testing' },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      sidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-gray-900">Support Agent</h1>
              <p className="text-sm text-gray-500">Smart Assistant</p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={sidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title={sidebarCollapsed ? `${item.name} - ${item.description}` : undefined}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Terminal Toggle */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <button
          onClick={toggleTerminal}
          className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
            isTerminalVisible 
              ? 'bg-gray-100 text-gray-900' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title={sidebarCollapsed ? 'Toggle Terminal' : undefined}
        >
          <span className="text-xl mr-3">⌨️</span>
          {!sidebarCollapsed && (
            <div className="flex-1 text-left">
              <div className="font-medium">Terminal</div>
              <div className="text-xs text-gray-500">
                {isTerminalVisible ? 'Hide CLI' : 'Show CLI'}
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navigation;