import React from 'react';
import SettingInfoTooltip from './SettingInfoTooltip';

/**
 * FormField
 * Wraps a label + children + optional hint text.
 * @param {string|ReactNode} label
 * @param {string|ReactNode} hint
 * @param {{ title, description, docsUrl }} [info] - If provided, renders an info (i) button next to the label
 */
export function FormField({ label, hint, info, children }) {
    return (
        <div className="form-group">
            {label && (
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    <span>{label}</span>
                    {info && (
                        <SettingInfoTooltip
                            title={info.title}
                            description={info.description}
                            docsUrl={info.docsUrl}
                        />
                    )}
                </label>
            )}
            {children}
            {hint && <small style={{ display: 'block', marginTop: '5px', fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{hint}</small>}
        </div>
    );
}

/**
 * SettingsCard
 * Card wrapper with optional left accent bar, icon, and title.
 * @param {{ title, description, docsUrl }} [info] - If provided, renders an info (i) button next to the card title
 */
export function SettingsCard({ title, icon: Icon, iconColor, accentColor, info, children, style = {} }) {
    return (
        <div className="glass-card" style={{ borderRadius: '8px', position: 'relative', overflow: 'visible', ...style }}>
            {accentColor && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: accentColor, borderRadius: '8px 0 0 8px' }} />
            )}
            <div style={{ padding: '1rem', paddingLeft: accentColor ? '1.25rem' : '1rem' }}>
                {title && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '1rem' }}>
                        {Icon && <Icon size={14} color={iconColor || 'var(--color-primary)'} />}
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{title}</h3>
                        {info && (
                            <SettingInfoTooltip
                                title={info.title}
                                description={info.description}
                                docsUrl={info.docsUrl}
                            />
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

