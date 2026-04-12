import React from 'react';
import { Folder, Activity, Zap } from 'lucide-react';
import StatCard from './StatCard';

const StatsRow = ({ projectsCount }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
      <StatCard
        title="Total Projects"
        value={projectsCount}
        icon={Folder}
      />
      <StatCard
        title="System Status"
        value={
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3ECF8E', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#3ECF8E', boxShadow: '0 0 10px #3ECF8E' }}></span>
            Operational
          </div>
        }
        icon={Activity}
      />
      <StatCard
        title="Current Plan"
        value="Free Tier"
        icon={Zap}
        color="#FFBD2E"
        background="rgba(255, 189, 46, 0.1)"
      />
    </div>
  );
};

export default StatsRow;
