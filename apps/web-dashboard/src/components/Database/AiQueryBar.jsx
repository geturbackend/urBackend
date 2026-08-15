import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AiQueryBar = ({ projectId, activeCollection, onFiltersGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const canSubmit = Boolean(projectId && activeCollection?.name);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || !canSubmit) return;

        setIsLoading(true);
        try {
            const res = await api.post(`/api/projects/${projectId}/ai/query-builder`, {
                collectionName: activeCollection?.name,
                prompt: prompt.trim()
            });

            if (res.data?.success && res.data?.data) {
                const { filters, sort } = res.data.data;
                if (typeof onFiltersGenerated === 'function') {
                    onFiltersGenerated(filters, sort);
                }
                toast.success('AI query applied!');
                setPrompt('');
            } else {
                toast.error('Failed to generate query.');
            }
        } catch (error) {
            console.error('AI Query Error:', error);
            toast.error(error.response?.data?.message || 'Error communicating with AI service');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className="ai-query-bar" 
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border)', 
                borderRadius: '6px', 
                padding: '2px 8px',
                height: '28px',
                width: '220px',
                transition: 'all 0.2s ease'
            }}
        >
            <Sparkles size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask AI to filter..."
                aria-label="Ask AI to filter data"
                disabled={isLoading || !activeCollection || !projectId}
                style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--color-text-main)', 
                    flex: 1, 
                    fontSize: '0.75rem',
                    outline: 'none',
                    minWidth: 0
                }}
            />
            {isLoading && <Loader2 size={13} className="spinner" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
            <style>{`
                .ai-query-bar:focus-within {
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 1px rgba(62, 207, 142, 0.25);
                    width: 260px;
                }
                .ai-query-bar input::placeholder {
                    color: var(--color-text-muted);
                    opacity: 0.7;
                }
            `}</style>
        </form>
    );
};

export default AiQueryBar;
