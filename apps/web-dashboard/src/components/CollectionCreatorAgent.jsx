import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export default function CollectionCreatorAgent({ projectId, onInsertAll }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! Tell me what you're building — for example: 'a food delivery app' or 'a SaaS project management tool' — and I'll design a MongoDB schema for you." }
  ]);
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [schema, setSchema] = useState(null);
  const [iterationsLeft, setIterationsLeft] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isInserting, setIsInserting] = useState(false);
  const [insertResults, setInsertResults] = useState(null);
  
  const messagesEndRef = useRef(null);
  const timersRef = useRef([]);

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

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || aiStatus === 'loading') return;
    
    const userText = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setAiStatus('loading');
    setInsertResults(null);
    
    try {
      const res = await api.post(`/api/projects/${projectId}/ai/collection-creator`, {
        userMessage: userText
      });
      
      const { message, schema: newSchema, iterationsLeft: left } = res.data.data;
      
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
      
      if (newSchema?.length) {
        setSchema(newSchema);
      }
      
      if (left !== undefined) {
        setIterationsLeft(left);
      }
      setAiStatus('idle');
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.error || "AI request failed. Please try again.";
      setAiStatus('error');
      toast.error(detail);
      
      // Automatically clear the error status after a short delay so they can type again
      const timer = setTimeout(() => {
          setAiStatus(prev => prev === 'error' ? 'idle' : prev);
      }, 2000);
      timersRef.current.push(timer);
    }
  };

  const handleInsertAll = async () => {
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
        timersRef.current.push(setTimeout(() => onInsertAll(), 1500));
      } else {
        toast.error(`${failed} collection(s) failed. ${created} created successfully.`);
        timersRef.current.push(setTimeout(() => onInsertAll(), 4000));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Bulk insert failed");
      setIsInserting(false);
    }
  };

  const getIterationsBadge = () => {
    if (iterationsLeft === null) return null; // BYOK
    
    // Total is always 3 for platform limit
    const used = 3 - iterationsLeft;
    const dots = Array(3).fill(0).map((_, i) => i < used ? '●' : '○').join('');
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span>{used} of 3 AI turns used <span style={{ marginLeft: '6px', letterSpacing: '0.1em' }}>{dots}</span></span>
        {iterationsLeft === 0 && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Add Groq API key in Settings for unlimited</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[75vh] mt-6 font-sans">
      
      {/* Chat Panel - Left */}
      <div className="card flex flex-col flex-1 h-full shadow-sm transition-all" style={{ padding: 0, display: 'flex', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--color-primary)' }}>✦</span> AI Schema Assistant
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Describe your application and let the AI generate a tailored schema.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                style={{ 
                  maxWidth: '85%', 
                  padding: '12px 16px', 
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  borderRadius: '14px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '14px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '14px',
                  backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-input)',
                  color: msg.role === 'user' ? '#000' : 'var(--color-text-main)',
                  border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 4px 12px rgba(0,0,0,0.02)' : '0 4px 12px rgba(62,207,142,0.15)',
                  whiteSpace: 'pre-wrap'
                }}
                className="transition-all"
              >
                {msg.content}
              </div>
            </div>
          ))}
          {aiStatus === 'loading' && (
            <div className="flex justify-start">
              <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '12px 16px', borderRadius: '14px', borderBottomLeftRadius: '4px', border: '1px solid var(--color-border)' }} className="flex space-x-2 items-center">
                <div className="spinner-small" style={{ width: '12px', height: '12px', borderTopColor: 'var(--color-primary)' }}></div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
          <form onSubmit={sendMessage} className="flex gap-3">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={aiStatus === 'loading' || (iterationsLeft === 0)}
              placeholder={iterationsLeft === 0 ? "Turn limit reached." : "Describe your app (e.g. e-commerce with reviews)..."}
              aria-label="Message the schema assistant"
              className="input-field"
              style={{ borderRadius: '24px', padding: '12px 20px', fontSize: '0.85rem' }}
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || aiStatus === 'loading' || (iterationsLeft === 0)}
              className="btn btn-primary"
              style={{ borderRadius: '24px', padding: '0 24px', opacity: (!inputValue.trim() || aiStatus === 'loading' || iterationsLeft === 0) ? 0.5 : 1 }}
            >
              Send
            </button>
          </form>
          {getIterationsBadge()}
        </div>
      </div>

      {/* Schema Preview Panel - Right */}
      <div className="card flex flex-col w-full md:w-[48%] h-full shadow-sm transition-all" style={{ padding: 0, display: 'flex', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Schema Preview
          </h3>
          {schema && schema.length > 0 && (
            <button
              onClick={handleInsertAll}
              disabled={isInserting}
              className="btn btn-primary"
              style={{ opacity: isInserting ? 0.7 : 1 }}
            >
              {isInserting ? (
                <>
                  <div className="spinner-small" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: '#000', width: '12px', height: '12px' }}></div>
                  Inserting...
                </>
              ) : `✓ Insert All (${schema.length})`}
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-main)' }}>
          {!schema || schema.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center transition-all" style={{ color: 'var(--color-text-muted)' }}>
              <div style={{ padding: '24px', borderRadius: '50%', backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', marginBottom: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: 500 }}>Your generated schema will appear here.</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '8px' }}>Start by chatting with the AI.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {insertResults && (
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '8px', animation: 'fadeIn 0.3s ease-out' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '12px' }}>Insert Results</p>
                  <ul className="space-y-3">
                    {insertResults.map((r, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '10px', fontSize: '0.8rem', color: r.success ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        <span style={{ marginTop: '1px', fontWeight: 700 }}>{r.success ? '✓' : '✗'}</span>
                        <span style={{ color: 'var(--color-text-main)' }}>
                          <strong style={{ fontWeight: 600 }}>{r.collection}</strong>
                          {!r.success && <span style={{ display: 'block', color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '4px', opacity: 0.9 }}>{r.error}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {schema.map((col, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', animation: 'fadeIn 0.4s ease-out' }} className="transition-all hover:border-white/20 shadow-sm">
                  <div style={{ backgroundColor: 'var(--color-bg-input)', padding: '12px 18px', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-primary)', marginRight: '10px', fontSize: '1.2rem' }}>⛁</span>
                    {col.collection}
                  </div>
                  <div>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                      <tbody style={{ display: 'block', width: '100%' }}>
                        {col.fields?.map((f, i) => (
                          <tr key={i} style={{ display: 'flex', width: '100%', borderBottom: i < col.fields.length - 1 ? '1px solid var(--color-border)' : 'none', backgroundColor: 'var(--color-bg-main)' }}>
                            <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: 'var(--color-text-main)', width: '50%', borderRight: '1px solid var(--color-border)' }}>{f.name}</td>
                            <td style={{ padding: '12px 18px', color: 'var(--color-text-muted)', width: '50%', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span className="badge" style={{ 
                                backgroundColor: 'var(--color-bg-input)', 
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-main)',
                                fontSize: '0.7rem',
                                padding: '4px 10px'
                              }}>
                                {f.type}
                              </span>
                              {f.type === 'Ref' && f.ref && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 500 }}>→ {f.ref}</span>
                              )}
                              {f.required && (
                                <span style={{ color: 'var(--color-danger)', marginLeft: 'auto', fontWeight: 700, fontSize: '0.9rem' }} title="Required">*</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
