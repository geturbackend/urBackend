import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { BarChart2 } from 'lucide-react';

export default function DeveloperMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [funnelRes, engRes] = await Promise.all([
          api.get('/api/analytics/funnel'),
          api.get('/api/analytics/engagement')
        ]);
        
        setMetrics({
          funnel: funnelRes.data?.data,
          engagement: engRes.data?.data
        });
      } catch (err) {
        console.error('Failed to load personal metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading || !metrics) return null;

  const { funnel, engagement } = metrics;
  
  // Calculate funnel progress
  const totalSteps = funnel?.steps?.length || 0;
  const completedSteps = funnel?.steps?.filter(s => s.completed).length || 0;
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="glass-card" style={{ 
      padding: '1.25rem', 
      borderRadius: '12px', 
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <BarChart2 size={16} color="var(--color-primary)" />
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>My Performance</h3>
      </div>

      {/* Activation Progress */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--color-text-muted)' }}>
          <span>Activation Status</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: '6px', background: 'var(--color-bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px' }} />
        </div>
      </div>

      {/* 30 Day Engagement */}
      {engagement && (
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            30-Day Activity
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ background: 'var(--color-bg-input)', padding: '0.5rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>API Calls</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{engagement.totalApiCalls?.toLocaleString() || 0}</div>
            </div>
            <div style={{ background: 'var(--color-bg-input)', padding: '0.5rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Mails Sent</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{engagement.totalMailSent?.toLocaleString() || 0}</div>
            </div>
            <div style={{ background: 'var(--color-bg-input)', padding: '0.5rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Storage</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{engagement.totalStorageUploads?.toLocaleString() || 0}</div>
            </div>
            <div style={{ background: 'var(--color-bg-input)', padding: '0.5rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Webhooks</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{engagement.totalWebhooksFired?.toLocaleString() || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
