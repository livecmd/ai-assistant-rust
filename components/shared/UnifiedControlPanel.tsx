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
        <div className={`control-panel-inner panel-compact unified-control-panel animate-fadeIn ${className}`}>
            {(titleKey || subtitleKey) && (
                <div className="unified-control-panel__header animate-fadeInDown">
                    <div className="unified-control-panel__title-row">
                        <span className="unified-control-panel__icon">
                            {icon || <Settings2 size={22} color="#1677ff" />}
                        </span>
                        {titleKey && (
                            <h1 className="unified-control-panel__title">
                                {t(titleKey)}
                            </h1>
                        )}
                    </div>
                    {subtitleKey && (
                        <p className="unified-control-panel__subtitle">{t(subtitleKey)}</p>
                    )}
                </div>
            )}

            <div className="panel-scroll-content">
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
            className={`control-section animate-fadeInUp ${collapsible ? "is-collapsible" : ""} ${isCollapsed ? "is-collapsed" : ""} ${className}`}
            style={{ animationDelay: '0.1s' }}
        >
            {title && (
                <div
                    className={`control-section__header ${collapsible ? "is-clickable" : ""}`}
                    onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
                >
                    <label className="control-section__title">
                        <span className="control-section__title-bar"></span>
                        {title}
                    </label>
                    {collapsible && (
                        <svg
                            className={`control-section__arrow ${isCollapsed ? "" : "is-open"}`}
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
                className={`control-section__body ${isCollapsed ? "is-hidden" : ""}`}
            >
                {children}
            </div>
        </div>
    );
};
