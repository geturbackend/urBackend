import React from 'react';

const UsageProgressBar = ({ label, used, limit, unit = 'MB', formatValue: customFormat, unlimited = false, tooltip = '' }) => {
  const isUnlimited = unlimited || limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(Math.round((used / limit) * 100), 100);
  
  let statusClass = '';
  if (percentage > 80) statusClass = 'danger';
  else if (percentage > 60) statusClass = 'warning';

  const format = (value) => {
    if (customFormat) return customFormat(value);
    if (unit === 'MB') {
      if (value > 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
      return `${(value / 1024).toFixed(1)} KB`;
    }
    return value;
  };

  return (
    <div style={{ marginBottom: '1rem', cursor: tooltip ? 'help' : 'default' }} title={tooltip}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{isUnlimited ? '∞' : `${percentage}%`}</span>
      </div>
      {!isUnlimited && (
        <div className="usage-bar-container">
          <div 
            className={`usage-bar-fill ${statusClass}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>
        {format(used)} / {isUnlimited ? '∞' : format(limit)} {unit !== 'MB' ? unit : ''}
      </div>
    </div>
  );
};

export default UsageProgressBar;
