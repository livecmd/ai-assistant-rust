import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getTimeString = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="w-full flex flex-col h-64 bg-[#0c0c0c] rounded-xl border border-gray-800 text-sm overflow-hidden shadow-inner">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-red-500"></div>
           <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
           <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-xs text-gray-500">SYSTEM TERMINAL</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {logs.length === 0 && (
            <div className="text-gray-600 italic">Waiting for system input...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-fade-in">
            <span className="text-gray-600 shrink-0">[{getTimeString(log.timestamp)}]</span>
            <span className={`${getColor(log.type)} break-all`}>
              {log.type === 'info' && <span className="mr-2 text-blue-500">➜</span>}
              {log.type === 'success' && <span className="mr-2 text-green-500">✔</span>}
              {log.type === 'error' && <span className="mr-2 text-red-500">✖</span>}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};