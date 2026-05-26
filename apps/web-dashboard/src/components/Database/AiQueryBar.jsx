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
                gap: '8px', 
                background: isLoading ? 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)' : 'rgba(255,255,255,0.03)',
                backgroundSize: '200% 100%',
                animation: isLoading ? 'shimmer 2s infinite linear' : 'none',
                border: '1px solid var(--color-border)', 
                borderRadius: '8px', 
                padding: '4px 12px',
                width: '300px',
                transition: 'all 0.3s ease'
            }}
        >
            <Sparkles size={16} color="var(--color-primary)" />
            <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask AI to filter data..."
                aria-label="Ask AI to filter data"
                disabled={isLoading || !activeCollection || !projectId}
                style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#fff', 
                    flex: 1, 
                    fontSize: '0.85rem',
                    outline: 'none'
                }}
            />
            {isLoading && <Loader2 size={16} className="spinner" style={{ color: 'var(--color-text-muted)' }} />}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .ai-query-bar:focus-within {
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
                }
            `}</style>
        </form>
    );
};

export default AiQueryBar;
