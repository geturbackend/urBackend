import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Webhook, Plus, Trash2, Edit2, X, Play, CheckCircle, 
  XCircle, Clock, RefreshCw, Eye, ChevronDown, ChevronUp, Copy
} from 'lucide-react';

export default function Webhooks() {
  const { projectId } = useParams();

  const [webhooks, setWebhooks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    enabled: true,
    events: {}
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delivery history state
  const [deliveriesWebhookId, setDeliveriesWebhookId] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState(null);

  // Test state
  const [testingWebhookId, setTestingWebhookId] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const collections = project?.collections || [];

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projRes, webhooksRes] = await Promise.all([
        api.get(`/api/projects/${projectId}`),
        api.get(`/api/projects/${projectId}/webhooks`)
      ]);
      setProject(projRes.data);
      setWebhooks(webhooksRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingWebhook(null);
    setFormData({
      name: '',
      url: '',
      secret: generateSecret(),
      enabled: true,
      events: {}
    });
    setIsModalOpen(true);
  };

  const openEditModal = (webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      secret: '', // Don't show existing secret
      enabled: webhook.enabled,
      events: webhook.events || {}
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWebhook(null);
    setFormData({ name: '', url: '', secret: '', enabled: true, events: {} });
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'whsec_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleEventToggle = (collection, action) => {
    setFormData(prev => {
      const events = { ...prev.events };
      if (!events[collection]) {
        events[collection] = { insert: false, update: false, delete: false };
      }
      events[collection] = { ...events[collection], [action]: !events[collection][action] };
      return { ...prev, events };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        url: formData.url,
        events: formData.events,
        enabled: formData.enabled
      };

      // Only include secret if provided (required for create, optional for update)
      if (formData.secret) {
        payload.secret = formData.secret;
      }

      if (editingWebhook) {
        await api.patch(`/api/projects/${projectId}/webhooks/${editingWebhook._id}`, payload);
        toast.success('Webhook updated');
      } else {
        await api.post(`/api/projects/${projectId}/webhooks`, payload);
        toast.success('Webhook created');
      }

      closeModal();
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Failed to save webhook';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/projects/${projectId}/webhooks/${deleteTarget._id}`);
      toast.success('Webhook deleted');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error('Failed to delete webhook');
    }
  };

  const handleTest = async (webhook) => {
    setTestingWebhookId(webhook._id);
    setTestResult(null);
    try {
      const res = await api.post(`/api/projects/${projectId}/webhooks/${webhook._id}/test`);
      setTestResult({ webhookId: webhook._id, ...res.data });
    } catch (err) {
      setTestResult({ 
        webhookId: webhook._id, 
        success: false, 
        error: err.response?.data?.error || 'Test failed' 
      });
    } finally {
      setTestingWebhookId(null);
    }
  };

  const openDeliveries = async (webhook) => {
    setDeliveriesWebhookId(webhook._id);
    setLoadingDeliveries(true);
    setDeliveries([]);
    try {
      const res = await api.get(`/api/projects/${projectId}/webhooks/${webhook._id}/deliveries?limit=50`);
      setDeliveries(res.data.data || []);
    } catch {
      toast.error('Failed to load delivery history');
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const closeDeliveries = () => {
    setDeliveriesWebhookId(null);
    setDeliveries([]);
    setExpandedDelivery(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={16} color="#22c55e" />;
      case 'failed':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <Clock size={16} color="#f59e0b" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const WebhooksSkeleton = () => (
    <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton" style={{ width: '100px', height: '18px' }} />
                    <div className="skeleton" style={{ width: '160px', height: '12px' }} />
                </div>
            </div>
            <div className="skeleton" style={{ width: '120px', height: '32px', borderRadius: '6px' }} />
        </div>
        {[1, 2, 3].map(i => (
            <div key={i} className="glass-card" style={{ borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="skeleton" style={{ width: '120px', height: '16px' }} />
                        <div className="skeleton" style={{ width: '50px', height: '20px', borderRadius: '20px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="skeleton" style={{ width: '60px', height: '28px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '60px', height: '28px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />
                    </div>
                </div>
                <div className="skeleton" style={{ width: '70%', height: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '20px' }} />
                    <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '20px' }} />
                    <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '20px' }} />
                </div>
            </div>
        ))}
    </div>
);

if (loading) return <WebhooksSkeleton />;

  return (
    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Webhook size={28} color="var(--color-primary)" /> Webhooks
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Send HTTP callbacks when data changes in your collections
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> Add Webhook
        </button>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Webhook size={48} color="var(--color-text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No webhooks configured</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Create a webhook to receive notifications when data changes
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Create your first webhook
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {webhooks.map((webhook) => (
            <div key={webhook._id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(62, 207, 142, 0.1)', color: 'var(--color-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Webhook size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {webhook.name}
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: webhook.enabled ? 'rgba(62, 207, 142, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: webhook.enabled ? 'var(--color-primary)' : '#ef4444',
                          border: `1px solid ${webhook.enabled ? 'rgba(62, 207, 142, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                          {webhook.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </h3>
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--color-bg-input)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', marginBottom: '1rem', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    <span style={{ color: '#666', fontSize: '0.8rem', marginRight: '10px', userSelect: 'none' }}>POST</span>
                    <code style={{ color: 'var(--color-text-main)', fontSize: '0.85rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {webhook.url}
                    </code>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>Triggers on:</span>
                    {Object.entries(webhook.events || {}).map(([coll, events]) => 
                      Object.entries(events).filter(([, v]) => v).map(([action]) => (
                        <span key={`${coll}-${action}`} style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-main)'
                        }}>
                          {coll} <span style={{ color: 'var(--color-text-muted)' }}>→</span> <span style={{ color: 'var(--color-primary)' }}>{action}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                  <button className="btn btn-primary" onClick={() => handleTest(webhook)} disabled={testingWebhookId === webhook._id} style={{ width: '100%', justifyContent: 'center' }}>
                    {testingWebhookId === webhook._id ? <RefreshCw size={16} className="spin" /> : <Play size={16} />} 
                    Test
                  </button>
                  <button className="btn btn-secondary" onClick={() => openDeliveries(webhook)} style={{ width: '100%', justifyContent: 'center' }}>
                    <Clock size={16} /> History
                  </button>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button className="btn btn-secondary" onClick={() => openEditModal(webhook)} style={{ flex: 1, padding: '6px' }} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-danger" onClick={() => setDeleteTarget(webhook)} style={{ flex: 1, padding: '6px' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {/* Test Result */}
              {testResult && testResult.webhookId === webhook._id && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${testResult.success ? '#22c55e' : '#ef4444'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                    {testResult.success ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                    <strong>{testResult.success ? 'Test successful' : 'Test failed'}</strong>
                    {testResult.statusCode && <span style={{ color: 'var(--color-text-muted)' }}>({testResult.statusCode})</span>}
                    {testResult.durationMs && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{testResult.durationMs}ms</span>}
                  </div>
                  {testResult.error && <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444' }}>{testResult.error}</p>}
                  {testResult.responseBody && (
                    <pre style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {testResult.responseBody}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</h2>
              <button className="btn btn-ghost" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Name */}
                <div className="input-group">
                  <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="My Webhook"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* URL */}
                <div className="input-group">
                  <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>Endpoint URL</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://example.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--color-text-muted)' }}>Must use HTTPS (or http://localhost for development)</small>
                </div>

                {/* Secret */}
                <div className="input-group">
                  <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                    Signing Secret {editingWebhook && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(leave blank to keep existing)</span>}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={editingWebhook ? '••••••••••••••••••••' : 'whsec_...'}
                      value={formData.secret}
                      onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                      required={!editingWebhook}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={() => setFormData({ ...formData, secret: generateSecret() })}>
                      Generate
                    </button>
                    {formData.secret && (
                      <button type="button" className="btn btn-ghost" onClick={() => copyToClipboard(formData.secret)} title="Copy">
                        <Copy size={16} />
                      </button>
                    )}
                  </div>
                  <small style={{ color: 'var(--color-text-muted)' }}>Used for HMAC-SHA256 signature verification</small>
                </div>

                {/* Enabled */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="webhook-enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  <label htmlFor="webhook-enabled" style={{ fontWeight: 600 }}>Enabled</label>
                </div>

                {/* Events */}
                <div>
                  <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>Events</label>
                  {collections.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>No collections available. Create a collection first.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflow: 'auto', padding: '0.5rem', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                      {collections.map((coll) => (
                        <div key={coll.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 500, minWidth: '120px' }}>{coll.name}</span>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            {['insert', 'update', 'delete'].map((action) => (
                              <label key={action} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={formData.events[coll.name]?.[action] || false}
                                  onChange={() => handleEventToggle(coll.name, action)}
                                />
                                <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{action}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingWebhook ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery History Modal */}
      {deliveriesWebhookId && (
        <div className="modal-overlay" onClick={closeDeliveries}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>Delivery History</h2>
              <button className="btn btn-ghost" onClick={closeDeliveries}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {loadingDeliveries ? (
                <p>Loading...</p>
              ) : deliveries.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>No deliveries yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {deliveries.map((delivery) => (
                    <div key={delivery._id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          background: expandedDelivery === delivery._id ? 'var(--color-bg-secondary)' : 'transparent'
                        }}
                        onClick={() => setExpandedDelivery(expandedDelivery === delivery._id ? null : delivery._id)}
                      >
                        {getStatusIcon(delivery.finalStatus)}
                        <span style={{ fontWeight: 500, flex: 1 }}>{delivery.event}</span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          {delivery.attempts?.length || 0} attempt{(delivery.attempts?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          {formatDate(delivery.createdAt)}
                        </span>
                        {expandedDelivery === delivery._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                      {expandedDelivery === delivery._id && (
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong>Payload:</strong>
                            <pre style={{ 
                              background: 'var(--color-bg-main)', 
                              padding: '0.75rem', 
                              borderRadius: '6px', 
                              fontSize: '0.8rem',
                              overflow: 'auto',
                              maxHeight: '150px',
                              marginTop: '0.5rem'
                            }}>
                              {JSON.stringify(delivery.payload, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <strong>Attempts:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
                              {(delivery.attempts || []).map((attempt, idx) => (
                                <div key={idx} style={{ 
                                  padding: '0.5rem 0.75rem', 
                                  borderRadius: '6px', 
                                  background: 'var(--color-bg-main)',
                                  fontSize: '0.85rem'
                                }}>
                                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span>#{attempt.attemptNumber}</span>
                                    {getStatusIcon(attempt.status)}
                                    {attempt.statusCode && <span>Status: {attempt.statusCode}</span>}
                                    {attempt.durationMs && <span>{attempt.durationMs}ms</span>}
                                    <span style={{ color: 'var(--color-text-muted)' }}>{formatDate(attempt.attemptedAt)}</span>
                                  </div>
                                  {attempt.error && <p style={{ margin: '0.5rem 0 0', color: '#ef4444' }}>{attempt.error}</p>}
                                  {attempt.responseBody && (
                                    <pre style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
                                      {attempt.responseBody}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Webhook</h2>
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn" onClick={handleDelete} style={{ background: 'var(--color-danger)', color: 'white' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          width: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }
        .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}
