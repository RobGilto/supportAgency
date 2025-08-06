import React, { useState, useRef, useEffect } from 'react';

const FallbackTerminal: React.FC = () => {
  const [commands, setCommands] = useState<string[]>([
    'Smart Support Agent CLI v1.0.0',
    'Type "help" for available commands.',
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when commands change
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  const processCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    setCommands(prev => [...prev, `$ ${cmd}`]);
    
    switch (trimmedCmd) {
      case 'help':
        setCommands(prev => [...prev, 
          'Available commands:',
          '  help     - Show this help message',
          '  clear    - Clear the terminal',
          '  status   - Show system status',
          '  cases    - List recent cases',
          '  version  - Show version info',
        ]);
        break;
      
      case 'clear':
        setCommands(['Smart Support Agent CLI v1.0.0', 'Type "help" for available commands.']);
        break;
      
      case 'status':
        setCommands(prev => [...prev,
          'System Status: ✅ Online',
          'Database: ✅ Connected',
          'Image Processing: ✅ Ready',
          'Case Management: ✅ Active',
        ]);
        break;
      
      case 'cases':
        setCommands(prev => [...prev,
          'Recent Cases:',
          '  • No cases yet - create one in the Cases page',
          '  • Use the Image Gallery to upload screenshots',
          '  • Paste content in Inbox for quick case creation',
        ]);
        break;
      
      case 'version':
        setCommands(prev => [...prev,
          'Smart Support Agent v1.0.0',
          'React: 18.2.0',
          'TypeScript: 5.3.3',
          'Vite: 5.1.0',
        ]);
        break;
      
      case '':
        // Empty command, just add prompt
        break;
      
      default:
        setCommands(prev => [...prev, `Command not found: ${cmd}. Type "help" for available commands.`]);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCommand(currentInput);
    setCurrentInput('');
  };

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      ref={terminalRef}
      className="bg-gray-900 text-green-400 font-mono text-sm h-full w-full overflow-auto cursor-text"
      onClick={handleTerminalClick}
    >
      <div className="p-4 space-y-1 min-h-full">
        {commands.map((command, index) => (
          <div key={index} className="whitespace-pre-wrap">
            {command}
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400 mr-1">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="bg-transparent outline-none flex-1 text-green-400 font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
};

export default FallbackTerminal;