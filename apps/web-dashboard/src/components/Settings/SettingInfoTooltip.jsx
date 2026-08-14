import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Info, ExternalLink, X } from 'lucide-react';

/**
 * SettingInfoTooltip
 *
 * Renders a small circular `i` button next to a label/title.
 * On click, opens a rich popover card (via React Portal → document.body, z-index 9999)
 * with a description and a "Learn more" docs link.
 *
 * Props:
 *   title       {string} - Popover heading
 *   description {string} - Detailed explanation (supports simple HTML via dangerouslySetInnerHTML
 *                          if needed, but plain text is preferred for safety)
 *   docsUrl     {string} - Full URL to the relevant docs.ub.bitbros.in page
 */
export default function SettingInfoTooltip({ title, description, docsUrl }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, align: 'left' });
    const btnRef = useRef(null);
    const popoverRef = useRef(null);

    const calculatePosition = useCallback(() => {
        if (!btnRef.current) return;

        const isMobile = window.innerWidth < 640;
        if (isMobile) {
            setPos({ top: '50%', left: '50%', align: 'center' });
            return;
        }

        const rect = btnRef.current.getBoundingClientRect();
        const POPOVER_WIDTH = 320;
        const POPOVER_OFFSET = 8; // gap between button and popover

        // Prefer opening to the right; if not enough space, open to the left
        const spaceRight = window.innerWidth - rect.right;
        const spaceLeft = rect.left;

        let left;
        let align;
        if (spaceRight >= POPOVER_WIDTH + POPOVER_OFFSET) {
            left = rect.right + POPOVER_OFFSET + window.scrollX;
            align = 'left';
        } else if (spaceLeft >= POPOVER_WIDTH + POPOVER_OFFSET) {
            left = rect.left - POPOVER_WIDTH - POPOVER_OFFSET + window.scrollX;
            align = 'left';
        } else {
            // Center horizontally under the button
            left = Math.max(8, rect.left + rect.width / 2 - POPOVER_WIDTH / 2 + window.scrollX);
            align = 'left';
        }

        const top = rect.top + window.scrollY;

        setPos({ top, left, align });
    }, []);

    const handleOpen = (e) => {
        e.stopPropagation();
        calculatePosition();
        setOpen(true);
    };

    const handleClose = useCallback(() => setOpen(false), []);

    // Click outside
    useEffect(() => {
        if (!open) return;

        const onClickOutside = (e) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target) &&
                btnRef.current && !btnRef.current.contains(e.target)
            ) {
                handleClose();
            }
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape') handleClose();
        };

        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, handleClose]);

    // Recalculate on scroll / resize
    useEffect(() => {
        if (!open) return;
        const recalc = () => calculatePosition();
        window.addEventListener('scroll', recalc, true);
        window.addEventListener('resize', recalc);
        return () => {
            window.removeEventListener('scroll', recalc, true);
            window.removeEventListener('resize', recalc);
        };
    }, [open, calculatePosition]);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    const popoverStyle = isMobile
        ? {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            width: 'calc(100vw - 32px)',
            maxWidth: '360px',
        }
        : {
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            width: '320px',
        };

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={handleOpen}
                aria-label={`More info about ${title}`}
                aria-expanded={open}
                title={`About: ${title}`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    transition: 'border-color 0.15s ease, color 0.15s ease, background 0.15s ease',
                    verticalAlign: 'middle',
                    marginLeft: '5px',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                    e.currentTarget.style.background = 'rgba(62,207,142,0.08)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
            >
                <Info size={9} strokeWidth={2.5} />
            </button>

            {open && ReactDOM.createPortal(
                <>
                    {/* Mobile backdrop */}
                    {isMobile && (
                        <div
                            onClick={handleClose}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.5)',
                                zIndex: 9998,
                            }}
                        />
                    )}

                    <div
                        ref={popoverRef}
                        role="tooltip"
                        aria-live="polite"
                        style={{
                            ...popoverStyle,
                            background: 'var(--color-bg-card, #161b22)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '10px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                            overflow: 'hidden',
                            animation: 'sitTooltipIn 0.12s ease',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px 8px',
                            borderBottom: '1px solid var(--color-border)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <Info size={13} color="var(--color-primary)" />
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{title}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                aria-label="Close info"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '3px',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                                <X size={13} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '10px 12px' }}>
                            <p style={{
                                fontSize: '0.76rem',
                                color: 'var(--color-text-muted)',
                                lineHeight: 1.6,
                                margin: 0,
                            }}>
                                {description}
                            </p>
                        </div>

                        {/* Footer — Learn more */}
                        {docsUrl && (
                            <div style={{
                                padding: '8px 12px',
                                borderTop: '1px solid var(--color-border)',
                                background: 'rgba(255,255,255,0.02)',
                            }}>
                                <a
                                    href={docsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '0.73rem',
                                        fontWeight: 600,
                                        color: 'var(--color-primary)',
                                        textDecoration: 'none',
                                        transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                                >
                                    <ExternalLink size={11} />
                                    Learn more in docs
                                </a>
                            </div>
                        )}
                    </div>

                    <style>{`
                        @keyframes sitTooltipIn {
                            from { opacity: 0; transform: translateY(-4px) ${isMobile ? 'translate(-50%,-50%)' : ''}; }
                            to   { opacity: 1; transform: translateY(0)   ${isMobile ? 'translate(-50%,-50%)' : ''}; }
                        }
                    `}</style>
                </>,
                document.body
            )}
        </>
    );
}
