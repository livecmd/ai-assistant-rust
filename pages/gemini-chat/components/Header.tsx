import React from 'react';
import { Bot } from 'lucide-react';
import { GeminiModelVersion } from '../types';

interface HeaderProps {
  currentModel: GeminiModelVersion;
  setModel: (model: GeminiModelVersion) => void;
}

const Header: React.FC<HeaderProps> = ({ currentModel, setModel }) => {
  return (
    <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-[#0f172a]/90 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-2 text-blue-400">
        <Bot size={28} />
        <h1 className="text-xl font-bold text-slate-100">Gemini Chat</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 hidden sm:block">模型版本:</span>
        <select 
          value={currentModel}
          onChange={(e) => setModel(e.target.value as GeminiModelVersion)}
          className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="gemini-3-flash">gemini-3-flash</option>
          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
          <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
        </select>
      </div>
    </header>
  );
};

export default Header;
