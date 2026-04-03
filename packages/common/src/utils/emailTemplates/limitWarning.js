'use strict';

/**
 * Generates an HTML email for resource limit warnings.
 *
 * @param {Object} params
 * @param {string} params.projectName  - Name of the project
 * @param {string} params.resourceType - 'storage' | 'database'
 * @param {string} params.currentUsage - Human-readable current usage (e.g. "82 MB")
 * @param {string} params.limit        - Human-readable limit (e.g. "100 MB")
 * @param {number|null} params.percentage - Integer percentage (null for BYOD absolute alerts)
 * @param {boolean} params.isBYOD      - Whether the project uses external (BYOD) resources
 * @returns {string} HTML string
 */
const limitWarningTemplate = ({
    projectName,
    resourceType,
    currentUsage,
    limit,
    percentage,
    isBYOD,
}) => {
    const resourceLabel = resourceType === 'storage' ? 'Storage' : 'Database';
    const resourceIcon = resourceType === 'storage' ? '🗄️' : '🛢️';

    const alertHeadline = isBYOD
        ? `Your custom ${resourceLabel.toLowerCase()} alert threshold has been reached.`
        : `You've used <strong>${percentage}%</strong> of your ${resourceLabel.toLowerCase()} limit.`;

    const usageBlock = isBYOD
        ? `<div class="stat"><span class="stat-label">Current usage</span><span class="stat-value">${currentUsage}</span></div>`
        : `
        <div class="stat"><span class="stat-label">Current usage</span><span class="stat-value">${currentUsage}</span></div>
        <div class="stat"><span class="stat-label">Plan limit</span><span class="stat-value">${limit}</span></div>
        <div class="stat"><span class="stat-label">Usage</span><span class="stat-value">${percentage}%</span></div>`;

    const actionItems = resourceType === 'storage'
        ? `<li>Delete unused files from your project</li>
           ${isBYOD ? '<li>Expand your external storage bucket capacity</li>' : '<li>Upgrade your plan for higher limits</li>'}
           <li>Review large file uploads and remove duplicates</li>`
        : `<li>Remove stale or test documents from your collections</li>
           ${isBYOD ? '<li>Scale up your external MongoDB cluster</li>' : '<li>Upgrade your plan for higher limits</li>'}
           <li>Optimise your data schema to reduce document size</li>`;

    const footerNote = isBYOD
        ? 'This is a custom alert you configured in your project settings.'
        : 'You will receive at most one alert per threshold every 7 days.';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#ffffff;color:#111111;margin:0;padding:0}
    .container{max-width:600px;margin:0 auto;padding:40px 20px}
    .logo{margin-bottom:32px;font-weight:800;font-size:24px;letter-spacing:-.03em;color:#111}
    .badge{display:inline-block;padding:4px 10px;background:#f59e0b;color:#fff;border-radius:6px;font-size:13px;font-weight:600;margin-bottom:24px}
    h1{font-size:26px;font-weight:700;line-height:1.2;margin-bottom:16px;letter-spacing:-.02em}
    .alert-box{background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;padding:16px 20px;margin:24px 0;font-size:15px;line-height:1.6;color:#333}
    .stats{background:#f8f9fa;border-radius:8px;padding:16px 20px;margin:20px 0}
    .stat{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #efefef;font-size:14px}
    .stat:last-child{border-bottom:none}
    .stat-label{color:#666}
    .stat-value{font-weight:600;color:#111}
    .actions{font-size:15px;line-height:1.6;color:#444;margin-bottom:24px}
    .actions ul{padding-left:20px;margin:12px 0}
    .actions li{margin-bottom:8px}
    .cta{display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px}
    .footer{margin-top:64px;padding-top:32px;border-top:1px solid #eee;font-size:13px;color:#888}
    .footer p{margin:4px 0}
  </style>
</head>
<body>
<div class="container">
  <div class="logo">urBackend</div>
  <div class="badge">${resourceIcon} ${resourceLabel} Alert</div>
  <h1>Resource Limit Warning</h1>

  <div class="alert-box">
    <strong>Project:</strong> ${projectName}<br/>
    ${alertHeadline}
  </div>

  <div class="stats">
    ${usageBlock}
  </div>

  <div class="actions">
    <strong>What you can do:</strong>
    <ul>
      ${actionItems}
      <li>Adjust alert preferences in your project settings</li>
    </ul>
  </div>

  <a href="https://urbackend.bitbros.in/dashboard" class="cta">Go to Dashboard</a>

  <div class="footer">
    <p>${footerNote}</p>
    <p>© ${new Date().getFullYear()} urBackend Inc. • Developer platform.</p>
  </div>
</div>
</body>
</html>`;
};

module.exports = limitWarningTemplate;
