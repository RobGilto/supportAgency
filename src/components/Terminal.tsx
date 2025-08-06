import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  height?: number;
  className?: string;
}

const Terminal: React.FC<TerminalProps> = ({ height = 200, className = '' }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);

  // Monitor container readiness
  useEffect(() => {
    if (!terminalRef.current) return;

    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    const checkContainerReady = () => {
      if (terminalRef.current && attempts < maxAttempts) {
        const rect = terminalRef.current.getBoundingClientRect();
        console.log('Container readiness check:', { 
          attempt: attempts + 1, 
          width: rect.width, 
          height: rect.height 
        });
        
        if (rect.width > 0 && rect.height > 0) {
          console.log('Container ready for terminal initialization');
          setIsContainerReady(true);
          return;
        }
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        // If not ready, check again
        setTimeout(checkContainerReady, 16);
      } else {
        console.warn('Container readiness check timeout after', maxAttempts, 'attempts');
        // Force ready state to prevent hanging
        setIsContainerReady(true);
      }
    };

    // Reset attempts when height changes
    attempts = 0;
    setIsContainerReady(false);
    checkContainerReady();
  }, [height]);

  // Initialize terminal only when container is ready
  useEffect(() => {
    if (!terminalRef.current || !isContainerReady) return;

    // Initialize xterm
    const xterm = new XTerm({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selectionBackground: '#ffffff20',
      },
      fontFamily: 'Consolas, Monaco, "Lucida Console", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    // Store references first
    xtermRef.current = xterm;

    // Open terminal in container first
    try {
      xterm.open(terminalRef.current);
    } catch (error) {
      console.error('Failed to open terminal:', error);
      return;
    }

    // Initialize fit addon after terminal is opened
    const fitAddon = new FitAddon();
    
    try {
      xterm.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;
    } catch (error) {
      console.error('Failed to load fit addon:', error);
      // Continue without fit addon
    }
    
    // More robust fit with container dimension checks and error handling
    const tryFit = () => {
      if (!terminalRef.current || !fitAddon || !xtermRef.current) {
        console.log('Terminal not ready for fitting');
        return;
      }

      const container = terminalRef.current;
      
      // Check if container is in DOM and has dimensions
      if (!container.isConnected) {
        console.log('Container not in DOM, skipping fit');
        return;
      }

      const rect = container.getBoundingClientRect();
      
      // Only fit if container has valid dimensions
      if (rect.width > 0 && rect.height > 0) {
        try {
          // Attempt to fit the terminal
          fitAddon.fit();
          console.log('Terminal fit successful');
        } catch (error) {
          console.warn('Terminal fit failed, will continue without fitting:', error);
          // Don't retry if fit fails - just continue without it
        }
      } else {
        console.log('Container has no dimensions, delaying fit');
        setTimeout(tryFit, 100);
      }
    };

    // Initialize welcome message first
    xterm.writeln('Smart Support Agent CLI v1.0.0');
    xterm.writeln('Type "help" for available commands.');
    xterm.write('$ ');

    // Delay fitting until after terminal content is written
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(tryFit);
      });
    }, 200);

    // Handle user input
    let currentLine = '';
    xterm.onData((data) => {
      const char = data;
      
      if (char === '\r') {
        // Enter key - process command
        xterm.write('\r\n');
        if (currentLine.trim()) {
          processCommand(currentLine.trim(), xterm);
        }
        currentLine = '';
        xterm.write('$ ');
      } else if (char === '\u007f') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          xterm.write('\b \b');
        }
      } else if (char.charCodeAt(0) >= 32) {
        // Printable character
        currentLine += char;
        xterm.write(char);
      }
    });

    // Handle resize with robust dimension checks
    const handleResize = () => {
      if (fitAddon && xtermRef.current && terminalRef.current) {
        const container = terminalRef.current;
        const rect = container.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0) {
          requestAnimationFrame(() => {
            try {
              fitAddon.fit();
            } catch (error) {
              console.warn('Terminal resize fit failed:', error);
            }
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [isContainerReady]);

  useEffect(() => {
    // Fit terminal when height changes with robust checks
    if (fitAddonRef.current && xtermRef.current && terminalRef.current) {
      const container = terminalRef.current;
      const rect = container.getBoundingClientRect();
      
      if (rect.width > 0 && rect.height > 0) {
        requestAnimationFrame(() => {
          try {
            fitAddonRef.current?.fit();
          } catch (error) {
            console.warn('Terminal height change fit failed:', error);
          }
        });
      }
    }
  }, [height]);

  return (
    <div 
      className={`bg-gray-900 border-t border-gray-200 ${className}`}
      style={{ height: `${height}px` }}
    >
      <div
        ref={terminalRef}
        className="w-full h-full p-2"
        style={{ height: '100%' }}
      />
    </div>
  );
};

// Simple command processor for demo purposes
const processCommand = (command: string, xterm: XTerm) => {
  const [cmd] = command.split(' ');
  
  switch (cmd.toLowerCase()) {
    case 'help':
      xterm.writeln('Available commands:');
      xterm.writeln('  help         - Show this help message');
      xterm.writeln('  clear        - Clear the terminal');
      xterm.writeln('  status       - Show application status');
      xterm.writeln('  version      - Show version information');
      xterm.writeln('  cases        - Case management commands (coming in Story 7)');
      xterm.writeln('  analytics    - Analytics commands (coming in Story 11)');
      break;
      
    case 'clear':
      xterm.clear();
      break;
      
    case 'status':
      xterm.writeln('Smart Support Agent Status:');
      xterm.writeln(`  Database: ✅ Connected (IndexedDB)`);
      xterm.writeln(`  Router: ✅ Active`);
      xterm.writeln(`  Terminal: ✅ Running`);
      break;
      
    case 'version':
      xterm.writeln('Smart Support Agent v1.0.0');
      xterm.writeln('Built with React + TypeScript + Vite');
      break;
      
    case 'cases':
      xterm.writeln('Case management functionality will be available in Story 7');
      break;
      
    case 'analytics':
      xterm.writeln('Analytics functionality will be available in Story 11');
      break;
      
    default:
      xterm.writeln(`Command not found: ${command}`);
      xterm.writeln('Type "help" for available commands.');
      break;
  }
};

export default Terminal;