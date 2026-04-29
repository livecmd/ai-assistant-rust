import React, { useState, KeyboardEvent } from 'react';
import { SendHorizontal, Loader2 } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-700 bg-[#0f172a] p-4 bottom-0 left-0 right-0 chat-input-area">
      <div className="max-w-4xl mx-auto relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="问点什么..."
          disabled={disabled}
          className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 rounded-full py-4 pl-6 pr-14 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="absolute right-2 p-2 bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? (
            <Loader2 className="animate-spin text-slate-300" size={20} />
          ) : (
            <SendHorizontal className="text-white" size={20} />
          )}
        </button>
      </div>
      <p className="text-center text-xs text-slate-500 mt-2">
        Gemini 可能会生成不准确的信息，请核实重要内容。
      </p>
    </div>
  );
};

export default InputArea;
