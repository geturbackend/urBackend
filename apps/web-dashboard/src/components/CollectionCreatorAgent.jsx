import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export default function CollectionCreatorAgent({ projectId, onInsertAll }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! Tell me what you're building — for example: 'a food delivery app' or 'a SaaS project management tool' — and I'll design a MongoDB schema for you." }
  ]);
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [schema, setSchema] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
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
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || aiStatus === 'loading') return;
    
    const userText = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setAiStatus('loading');
    
    try {
      const res = await api.post(`/api/projects/${projectId}/ai/collection-creator`, {
        userMessage: userText
      });
      
      const { type, message, schema: newSchema, iterationsLeft: left } = res.data.data;
      
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
      
      if (newSchema?.length) {
        setSchema(newSchema);
      }
      
      if (type === 'complete') {
        setIsComplete(true);
      } else {
        setIsComplete(false); // Just in case it goes back to clarifying
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
          if (f.unique !== undefined) fieldDef.unique = !!f.unique;
          if (f.ref) fieldDef.ref = f.ref;
          if (f.fields) fieldDef.fields = mapSchemaFields(f.fields);
          if (f.items) fieldDef.items = mapSchemaFields(f.items);
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
    } finally {
      setIsInserting(false);
    }
  };

  const getIterationsBadge = () => {
    if (iterationsLeft === null) return null; // BYOK
    
    // Total is always 3 for platform limit
    const used = 3 - iterationsLeft;
    const dots = Array(3).fill(0).map((_, i) => i < used ? '●' : '○').join('');
    
    return (
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{used} of 3 AI turns used <span className="ml-1 tracking-widest">{dots}</span></span>
        {iterationsLeft === 0 && <span className="text-orange-500 font-medium">Add Groq API key in Settings for unlimited</span>}
      </div>
    );
  };

  return (
    <div className="flex h-[75vh] w-full border border-border rounded-lg overflow-hidden bg-background shadow-sm font-sans mt-4">
      
      {/* Chat Panel - Left */}
      <div className="flex flex-col w-[55%] border-r border-border bg-muted/30 relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {aiStatus === 'loading' && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={aiStatus === 'loading' || (iterationsLeft === 0)}
              placeholder={iterationsLeft === 0 ? "Turn limit reached." : "Describe your app..."}
              aria-label="Message the schema assistant"
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || aiStatus === 'loading' || (iterationsLeft === 0)}
              className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
          {getIterationsBadge()}
        </div>
      </div>

      {/* Schema Preview Panel - Right */}
      <div className="w-[45%] flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
             Schema Preview
          </h3>
          {isComplete && schema && schema.length > 0 && (
            <button
              onClick={handleInsertAll}
              disabled={isInserting}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              {isInserting ? 'Inserting...' : `✓ Insert All (${schema.length})`}
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {!schema || schema.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
              <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>Your generated schema will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insertResults && (
                <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md shadow-sm text-sm">
                  <p className="font-semibold mb-2">Insert Results:</p>
                  <ul className="space-y-1">
                    {insertResults.map((r, i) => (
                      <li key={i} className={`flex items-start gap-2 ${r.success ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mt-0.5">{r.success ? '✓' : '✗'}</span>
                        <span>
                          <strong>{r.collection}</strong>
                          {!r.success && <span className="text-red-500 block text-xs">{r.error}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {schema.map((col, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 font-medium text-sm text-gray-700 font-mono flex items-center">
                    <span className="text-purple-600 mr-2">⛁</span>
                    {col.collection}
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {col.fields?.map((f, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono text-gray-700 w-1/2">{f.name}</td>
                            <td className="px-3 py-2 text-gray-500 w-1/2 flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                f.type === 'String' ? 'bg-blue-100 text-blue-700' :
                                f.type === 'Number' ? 'bg-green-100 text-green-700' :
                                f.type === 'Boolean' ? 'bg-yellow-100 text-yellow-700' :
                                f.type === 'Date' ? 'bg-purple-100 text-purple-700' :
                                f.type === 'Ref' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {f.type}
                              </span>
                              {f.type === 'Ref' && f.ref && (
                                <span className="text-xs text-orange-600">→ {f.ref}</span>
                              )}
                              {f.required && (
                                <span className="text-red-500 text-xs ml-auto font-medium" title="Required">*</span>
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
