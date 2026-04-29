import React, { useState, useEffect } from 'react';
import { i18n, Language } from '../i18n';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<Language>(i18n.getLanguage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = i18n.subscribe(() => {
      setCurrentLang(i18n.getLanguage());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const switchLanguage = (lang: Language) => {
    i18n.setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-colors text-sm"
        title="Switch Language"
      >
        <Globe size={16} />
        <span className="font-medium">{currentLang === 'zh-CN' ? '中文' : 'EN'}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
            <button
              onClick={() => switchLanguage('zh-CN')}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                currentLang === 'zh-CN' ? 'bg-slate-700 text-indigo-400 font-semibold' : 'text-slate-300'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => switchLanguage('en-US')}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                currentLang === 'en-US' ? 'bg-slate-700 text-indigo-400 font-semibold' : 'text-slate-300'
              }`}
            >
              English
            </button>
          </div>
        </>
      )}
    </div>
  );
};
