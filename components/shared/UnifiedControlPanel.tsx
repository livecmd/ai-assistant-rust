import React from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { TranslationKey } from '../../i18n/translations';

interface UnifiedControlPanelProps {
    titleKey?: TranslationKey;
    subtitleKey?: TranslationKey;
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export const UnifiedControlPanel: React.FC<UnifiedControlPanelProps> = ({
    titleKey,
    subtitleKey,
    children,
    className = "",
    icon
}) => {
    const { t } = useTranslation();

    return (
        <div className={`control-panel-inner animate-fadeIn ${className}`}>
            {/* Header Section */}
            {(titleKey || subtitleKey) && (
                <div className="text-center md:text-left mb-6 animate-fadeInDown">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                        {icon || <Settings2 className="w-6 h-6 text-indigo-400" />}
                        {titleKey && (
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                                {t(titleKey)}
                            </h1>
                        )}
                    </div>
                    {subtitleKey && (
                        <p className="text-slate-400 text-sm mt-1 pl-9">{t(subtitleKey)}</p>
                    )}
                </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex flex-col gap-5 pb-6">
                {children}
            </div>
        </div>
    );
};

export const ControlSection: React.FC<{
    title?: string;
    children: React.ReactNode;
    className?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
}> = ({ title, children, className = "", collapsible = false, defaultCollapsed = false }) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

    return (
        <div
            className={`
                bg-gradient-to-br from-slate-800/60 to-slate-800/40 
                border border-slate-700/50 
                rounded-2xl 
                overflow-hidden
                transition-all duration-300 ease-out
                hover:border-slate-600/50
                hover:shadow-lg hover:shadow-indigo-900/5
                animate-fadeInUp
                ${className}
            `}
            style={{ animationDelay: '0.1s' }}
        >
            {title && (
                <div
                    className={`
                        flex items-center justify-between 
                        px-5 py-4 
                        border-b border-slate-700/30
                        ${collapsible ? 'cursor-pointer hover:bg-slate-700/20' : ''}
                        transition-colors duration-200
                    `}
                    onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
                >
                    <label className="text-xs font-bold text-slate-400 tracking-widest flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                        {title}
                    </label>
                    {collapsible && (
                        <svg
                            className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            )}
            <div
                className={`
                    p-5 flex flex-col gap-4
                    transition-all duration-300 ease-out
                    ${isCollapsed ? 'max-h-0 py-0 opacity-0 overflow-hidden' : 'max-h-[1000px] opacity-100'}
                `}
            >
                {children}
            </div>
        </div>
    );
};
