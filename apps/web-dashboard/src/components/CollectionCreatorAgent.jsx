import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { Send, ArrowRight } from 'lucide-react';
import SchemaCanvasViewer from './SchemaCanvasViewer';

const SUGGESTIONS = [
  { label: 'E-commerce Platform', prompt: 'Create an e-commerce platform with products, categories, orders, customers, and product reviews' },
  { label: 'Project Management SaaS', prompt: 'Build a project management system with workspaces, projects, tasks, milestones, and team members' },
  { label: 'Subscription Billing API', prompt: 'Design a subscription service with plans, subscriptions, invoices, payment methods, and usage logs' },
  { label: 'Content Management (CMS)', prompt: 'Design a headless CMS with articles, authors, categories, media assets, and publishing revisions' },
];

const createMsg = (role, content) => ({
  id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  role,
  content
});

export default function CollectionCreatorAgent({ projectId, onInsertAll }) {
  const [messages, setMessages] = useState([
    createMsg('assistant', "Describe what you're building — for example: a multi-tenant SaaS, an e-commerce platform, or a workflow tool — and I will design a production-ready MongoDB schema for you.")
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
      setMessages([
        createMsg('assistant', "Describe what you're building — for example: a multi-tenant SaaS, an e-commerce platform, or a workflow tool — and I will design a production-ready MongoDB schema for you.")
      ]);
      setSchema(null);
      setInsertResults(null);
      setIterationsLeft(null);
      setIterationLimit(null);
      setInputValue('');
      toast.success("Chat reset");
    } catch (e) {
      console.error("Failed to delete session on server", e);
      const detail = e.response?.data?.message || e.response?.data?.error || "Failed to reset chat session. Please try again.";
      toast.error(detail);
    }
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
            key: f.name || f.key,
            type: f.type,
            required: !!f.required
          };
          if (f.type === 'Array') {
            if (f.items && typeof f.items === 'object') {
              const itemDef = { type: f.items.type || 'String' };
              if (f.items.type === 'Ref') {
                itemDef.ref = f.items.ref || 'users';
              } else if (f.items.type === 'Object') {
                itemDef.fields = f.items.fields?.length
                  ? mapSchemaFields(f.items.fields)
                  : [{ key: 'data', type: 'String', required: false }];
              }
              fieldDef.items = itemDef;
            } else {
              fieldDef.items = { type: typeof f.items === 'string' ? f.items : 'String' };
            }
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
    <div className="flex flex-col lg:flex-row gap-5 h-full w-full font-sans overflow-hidden">
      
      {/* Open Chat Stream & Pinned Composer - Left */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        
        {/* Messages Stream (Only this scrolls) */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3 min-h-0"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                style={{ 
                  maxWidth: '85%', 
                  padding: '10px 16px', 
                  fontSize: '0.85rem',
                  lineHeight: '1.55',
                  borderRadius: '14px',
                  borderBottomRightRadius: msg.role === 'user' ? '3px' : '14px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '3px' : '14px',
                  backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-card)',
                  color: msg.role === 'user' ? '#000' : 'var(--color-text-main)',
                  border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 1px 4px rgba(0,0,0,0.05)' : '0 2px 8px rgba(62,207,142,0.2)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Quick Start Suggestions on empty chat */}
          {messages.length <= 1 && !schema && (
            <div className="mt-1 flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider pl-1">
                Quick Start Ideas
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(null, s.prompt)}
                    disabled={aiStatus === 'loading' || iterationsLeft === 0}
                    className="text-left p-2.5 px-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-lg text-xs text-[var(--color-text-main)] flex items-center justify-between gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">{s.label}</span>
                    <ArrowRight size={12} className="opacity-50 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {aiStatus === 'loading' && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-bg-card)] p-2.5 px-4 rounded-xl rounded-bl-sm border border-[var(--color-border)] flex items-center gap-2.5 shadow-sm">
                <div className="spinner-small w-3.5 h-3.5 border-t-[var(--color-primary)]"></div>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  AI is designing your schema...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Pinned Bottom Composer */}
        <div className="mt-auto pt-2 flex-shrink-0">
          <div 
            className="relative flex items-end bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-2 px-3 shadow-lg transition-all focus-within:border-[var(--color-primary)]"
          >
            <textarea 
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={aiStatus === 'loading' || (iterationsLeft === 0)}
              placeholder={iterationsLeft === 0 ? "Turn limit reached. Add Groq key in Settings." : "Describe your app (e.g. e-commerce store, booking system, CRM...)"}
              aria-label="Message the schema assistant"
              rows={1}
              className="w-full bg-transparent border-0 outline-none text-[var(--color-text-main)] text-xs leading-relaxed resize-none max-h-[100px] min-h-[24px] py-1 placeholder:text-[var(--color-text-muted)]"
            />
            <button 
              type="button"
              onClick={sendMessage}
              disabled={!inputValue.trim() || aiStatus === 'loading' || (iterationsLeft === 0)}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-primary)] text-black border-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-all shrink-0 ml-2"
              title="Send message (Enter)"
            >
              <Send size={13} />
            </button>
          </div>
          {getIterationsBadge()}
        </div>
      </div>

      {/* Floating Schema Canvas Visualizer Panel - Right */}
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
