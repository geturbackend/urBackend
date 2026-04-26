import React from 'react';
import { Zap } from 'lucide-react';
import UsageProgressBar from './UsageProgressBar';
import { usePlan } from '../../context/PlanContext';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
};

const UsageQuota = () => {
  const { planData, openUpgradeModal } = usePlan();

  if (!planData) return null;

  const { plan, limits, usage } = planData;
  const isPro = plan === 'pro';

  return (
    <div className="glass-card" style={{ 
      padding: '1rem',
      borderRadius: '8px',
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Zap size={12} color="#7B61FF" /> Usage Quota
        </h4>
        <span style={{
          fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 600,
          background: isPro ? 'rgba(123, 97, 255, 0.15)' : 'rgba(100,100,100,0.1)',
          color: isPro ? '#7B61FF' : 'var(--color-text-muted)'
        }}>
          {isPro ? 'PRO' : 'FREE'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <UsageProgressBar
          label="Projects"
          used={usage?.totalProjects ?? 0}
          limit={limits?.maxProjects ?? 1}
          unit="Proj"
        />
        <UsageProgressBar
          label="Collections"
          used={usage?.totalCollections ?? 0}
          limit={limits?.maxCollections ?? 5}
          unit="Col"
          unlimited={limits?.maxCollections === -1}
        />
        <UsageProgressBar
          label="Auth Users"
          used={usage?.totalUsers ?? 0}
          limit={limits?.authUsersLimit ?? 200}
          unit="Users"
          unlimited={limits?.authUsersLimit === -1}
        />
        <UsageProgressBar
          label="Webhooks"
          used={usage?.totalWebhooks ?? 0}
          limit={limits?.webhooksLimit ?? 0}
          unit="Hooks"
          unlimited={limits?.webhooksLimit === -1}
        />
        <UsageProgressBar
          label="Database"
          used={usage?.totalDatabaseUsed ?? 0}
          limit={limits?.mongoBytes ?? 52428800}
          formatValue={formatBytes}
          unit=""
          unlimited={limits?.mongoBytes === -1 || limits?.byomEnabled}
        />
        <UsageProgressBar
          label="File Storage"
          used={usage?.totalStorageUsed ?? 0}
          limit={limits?.storageBytes ?? 10485760}
          formatValue={formatBytes}
          unit=""
          unlimited={limits?.storageBytes === -1}
        />
        <UsageProgressBar
          label="Requests"
          used={usage?.totalRequests ?? 0}
          limit={limits?.reqPerDay ?? 2000}
          unit="req"
          unlimited={limits?.reqPerDay === -1}
        />
      </div>

      {!isPro && (
        <button
          id="usage-quota-upgrade-btn"
          onClick={openUpgradeModal}
          style={{
            marginTop: '0.75rem', width: '100%',
            background: 'linear-gradient(135deg, #7B61FF22, #00C2FF11)',
            border: '1px solid #7B61FF44',
            borderRadius: '6px', padding: '6px',
            fontSize: '0.7rem', fontWeight: 600, color: '#7B61FF',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
          }}
        >
          <Zap size={10} /> Get 1 month Pro for free (Beta)
        </button>
      )}
    </div>
  );
};

export default UsageQuota;
