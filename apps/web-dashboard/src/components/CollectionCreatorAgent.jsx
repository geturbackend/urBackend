import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { Send, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import SchemaCanvasViewer from './SchemaCanvasViewer';

const SUGGESTIONS = [
  { label: '🛒 E-commerce store', prompt: 'Create an e-commerce platform with products, categories, orders, and customer reviews' },
  { label: '📋 Project management', prompt: 'Build a project management tool with workspaces, tasks, milestones, and time tracking' },
  { label: '📝 Blog platform', prompt: 'Design a blog with posts, authors, tags, comments, and draft management' },
  { label: '🎓 Learning platform', prompt: 'Create a learning platform with courses, modules, lessons, quizzes, and student enrollments' },
];

const createMsg = (role, content) => ({
  id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  role,
  content
});

export default function CollectionCreatorAgent({ projectId, onInsertAll }) {
  const [messages, setMessages] = useState([
    createMsg('assistant', "Hi! Tell me what you're building — for example: 'a food delivery app' or 'a SaaS project management tool' — and I'll design a MongoDB schema for you.")
  ]);
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [schema, setSchema] = useState(null);
  const [iterationsLeft, setIterationsLeft] = useState(null);
  const [iterationLimit, setIterationLimit] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isInserting, setIsInserting] = useState(false);
  const [insertResults, setInsertResults] = useState(null);
  
  const messagesEndRef = useRef(null);
  const timersRef = useRef([]);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiStatus]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  }, [inputValue]);

  const sendMessage = useCallback(async (e, overrideText) => {
    if (e) e.preventDefault();
    const textToSend = (overrideText || inputValue).trim();
    if (!textToSend || aiStatus === 'loading' || iterationsLeft === 0) return;
    
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setMessages(prev => [...prev, createMsg('user', textToSend)]);
    setAiStatus('loading');
    setInsertResults(null);
    
    try {
      const res = await api.post(`/api/projects/${projectId}/ai/collection-creator`, {
        userMessage: textToSend
      });
      
      const { message, schema: newSchema, iterationsLeft: left, iterationLimit: limit } = res.data.data;
      
      setMessages(prev => [...prev, createMsg('assistant', message)]);
      
      if (newSchema?.length) {
        setSchema(newSchema);
      }
      
      if (left !== undefined) {
        setIterationsLeft(left);
      }
      if (limit !== undefined) {
        setIterationLimit(limit);
      }
      setAiStatus('idle');
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.error || "AI request failed. Please try again.";
      setAiStatus('error');
      toast.error(detail);
      
      const timer = setTimeout(() => {
          setAiStatus(prev => prev === 'error' ? 'idle' : prev);
      }, 2000);
      timersRef.current.push(timer);
    }
  }, [inputValue, aiStatus, iterationsLeft, projectId]);

  const handleResetChat = async () => {
    if (aiStatus === 'loading') return;
    try {
      await api.delete(`/api/projects/${projectId}/ai/collection-creator/session`);
    } catch (e) {
      console.warn("Failed to delete session on server", e);
    }
    setMessages([
      createMsg('assistant', "Hi! Tell me what you're building — for example: 'a food delivery app' or 'a SaaS project management tool' — and I'll design a MongoDB schema for you.")
    ]);
    setSchema(null);
    setInsertResults(null);
    setIterationsLeft(null);
    setIterationLimit(null);
    setInputValue('');
    toast.success("Chat reset");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInsertAll = async () => {
    if (!schema || schema.length === 0) return;
    const confirmed = window.confirm(`Are you sure you want to create ${schema.length} collection(s) in your database?`);
    if (!confirmed) return;

    setIsInserting(true);
    setInsertResults(null);
    try {
      const mapSchemaFields = (fields) => {
        if (!fields) return [];
        return fields.map(f => {
          const fieldDef = {
            key: f.name,
            type: f.type,
            required: !!f.required
          };
          if (f.type === 'Array') {
            fieldDef.items = f.items ? (typeof f.items === 'object' ? f.items : { type: f.items }) : { type: 'String' };
          } else if (f.type === 'Object') {
            fieldDef.fields = f.fields?.length ? mapSchemaFields(f.fields) : [{ key: 'data', type: 'String', required: false }];
          } else if (f.type === 'Ref') {
            fieldDef.ref = f.ref || 'users';
          }
          if (f.unique !== undefined && !['Array', 'Object', 'Ref'].includes(f.type)) {
            fieldDef.unique = !!f.unique;
          }
          return fieldDef;
        });
      };

      const collections = schema.map(c => ({
        collectionName: c.collection,
        schema: mapSchemaFields(c.fields)
      }));

      const res = await api.post(`/api/projects/${projectId}/collections/bulk`, { collections });
      const { results, created, failed } = res.data.data;
      setInsertResults(results);

      // Clear AI session
      try {
        await api.delete(`/api/projects/${projectId}/ai/collection-creator/session`);
      } catch(e) {
        console.error("Failed to clear session", e);
      }

      if (failed === 0) {
        toast.success(`${created} collection(s) created successfully!`);
      } else {
        toast.error(`${failed} collection(s) failed. ${created} created successfully.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Bulk insert failed");
    } finally {
      setIsInserting(false);
    }
  };

  const getIterationsBadge = () => {
    if (iterationsLeft === null) return null; // BYOK
    
    const limit = iterationLimit || 3;
    const used = Math.max(0, limit - iterationsLeft);
    const dots = Array(limit).fill(0).map((_, i) => i < used ? '●' : '○').join('');
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', padding: '0 4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span>{used} of {limit} AI turns used <span style={{ marginLeft: '6px', letterSpacing: '0.1em' }}>{dots}</span></span>
        {iterationsLeft === 0 && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Add Groq API key in Settings for unlimited</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-170px)] min-h-[580px] font-sans">
      
      {/* Open Chat Stream & Floating Composer - Left */}
      <div className="flex flex-col flex-1 h-full relative" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Messages Stream (No container box) */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar" 
          style={{ 
            paddingRight: '1rem',
            paddingBottom: '1rem',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.25rem'
          }}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                style={{ 
                  maxWidth: '85%', 
                  padding: '14px 20px', 
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  borderRadius: '18px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '18px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '18px',
                  backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-card)',
                  color: msg.role === 'user' ? '#000' : 'var(--color-text-main)',
                  border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 2px 10px rgba(0,0,0,0.06)' : '0 4px 14px rgba(62,207,142,0.25)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Quick Start Suggestions on empty chat */}
          {messages.length <= 1 && !schema && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>
                Quick Start Ideas
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(null, s.prompt)}
                    disabled={aiStatus === 'loading'}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '0.825rem',
                      color: 'var(--color-text-main)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <span>{s.label}</span>
                    <ArrowRight size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {aiStatus === 'loading' && (
            <div className="flex justify-start">
              <div 
                style={{ 
                  backgroundColor: 'var(--color-bg-card)', 
                  padding: '12px 20px', 
                  borderRadius: '18px', 
                  borderBottomLeftRadius: '4px', 
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div className="spinner-small" style={{ width: '14px', height: '14px', borderTopColor: 'var(--color-primary)' }}></div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  AI is designing your schema...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Floating Bottom Composer */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', flexShrink: 0 }}>
          <div 
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '10px 14px 10px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            <textarea 
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={aiStatus === 'loading' || (iterationsLeft === 0)}
              placeholder={iterationsLeft === 0 ? "Turn limit reached. Add Groq key in Settings." : "Describe your app (e.g. e-commerce, project management, todo app...)"}
              aria-label="Message the schema assistant"
              rows={1}
              style={{ 
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--color-text-main)',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                resize: 'none',
                maxHeight: '130px',
                minHeight: '26px',
                padding: '4px 0'
              }}
            />
            <button 
              type="button"
              onClick={sendMessage}
              disabled={!inputValue.trim() || aiStatus === 'loading' || (iterationsLeft === 0)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: (inputValue.trim() && aiStatus !== 'loading' && iterationsLeft !== 0) ? 'var(--color-primary)' : 'var(--color-bg-input)',
                color: (inputValue.trim() && aiStatus !== 'loading' && iterationsLeft !== 0) ? '#000' : 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                cursor: (inputValue.trim() && aiStatus !== 'loading' && iterationsLeft !== 0) ? 'pointer' : 'default',
                opacity: (!inputValue.trim() || aiStatus === 'loading' || iterationsLeft === 0) ? 0.4 : 1,
                transition: 'all 0.2s ease',
                flexShrink: 0,
                marginLeft: '10px'
              }}
              title="Send message (Enter)"
            >
              <Send size={15} />
            </button>
          </div>
          {getIterationsBadge()}
        </div>
      </div>

      <SchemaCanvasViewer 
        schema={schema}
        messages={messages}
        insertResults={insertResults}
        isInserting={isInserting}
        onInsertAll={handleInsertAll}
        onResetChat={handleResetChat}
        onNavigateToDb={() => onInsertAll && onInsertAll()}
      />
    </div>
  );
}
