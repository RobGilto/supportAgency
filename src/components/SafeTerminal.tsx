import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import Terminal from './Terminal';
import FallbackTerminal from './FallbackTerminal';

interface SafeTerminalProps {
  height?: number;
  className?: string;
}

const SafeTerminal: React.FC<SafeTerminalProps> = ({ height = 200, className = '' }) => {
  const fallbackComponent = (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`} style={{ height }}>
      <div className="flex items-center space-x-2 text-yellow-700 mb-3">
        <span className="text-lg">🔧</span>
        <h3 className="font-semibold">Terminal Loading Issue</h3>
      </div>
      <p className="text-yellow-600 text-sm mb-4">
        The advanced terminal component encountered an issue. Using fallback terminal instead.
      </p>
      <div className="h-full">
        <FallbackTerminal />
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      fallback={fallbackComponent}
      componentName="Terminal"
    >
      <Terminal height={height} className={className} />
    </ErrorBoundary>
  );
};

export default SafeTerminal;