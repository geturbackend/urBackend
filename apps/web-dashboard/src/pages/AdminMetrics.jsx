import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fetchAdmin = async (path) => {
  const res = await fetch(`${API_URL}/api/admin/metrics/${path}`, {
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load');
  return json.data;
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-label">{label}</span>
      <span className="admin-stat-value" style={accent ? { color: accent } : {}}>
        {value ?? '—'}
      </span>
      {sub && <span className="admin-stat-sub">{sub}</span>}
    </div>
  );
}

function FunnelBar({ step, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const labels = {
    signup_completed: 'Signed Up',
    email_verified: 'Email Verified',
    project_created: 'Project Created',
    collection_created: 'Collection Created',
    first_api_success: 'First API Success',
  };
  return (
    <div className="admin-funnel-row">
      <span className="admin-funnel-label">{labels[step] ?? step}</span>
      <div className="admin-funnel-track">
        <div className="admin-funnel-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="admin-funnel-count">
        {count.toLocaleString()} <span className="admin-funnel-pct">({pct}%)</span>
      </span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminMetrics() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [featureUsage, setFeatureUsage] = useState(null);
  const [reliability, setReliability] = useState(null);
  const [topProjects, setTopProjects] = useState(null);
  const [churn, setChurn] = useState(null);
  const [cohorts, setCohorts] = useState(null);
  const [cohortMonth, setCohortMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, fn, fu, rl, tp, ch] = await Promise.all([
        fetchAdmin('overview'),
        fetchAdmin('activation-funnel'),
        fetchAdmin('feature-usage'),
        fetchAdmin('reliability'),
        fetchAdmin('top-projects'),
        fetchAdmin('churn-signals'),
      ]);
      setOverview(ov);
      setFunnel(fn);
      setFeatureUsage(fu);
      setReliability(rl);
      setTopProjects(tp);
      setChurn(ch);
    } catch (e) {
      if (e.message?.includes('Admin')) navigate('/dashboard');
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loadCohort = useCallback(async () => {
    try {
      const data = await fetchAdmin(`cohorts?month=${cohortMonth}`);
      setCohorts(data);
    } catch {
      setCohorts(null);
    }
  }, [cohortMonth]);

  useEffect(() => { queueMicrotask(() => load()); }, [load]);
  useEffect(() => { queueMicrotask(() => loadCohort()); }, [loadCohort]);

  const funnelMax = funnel?.steps?.[0]?.uniqueDevs || 1;

  return (
    <div className="admin-metrics-page">
      <div className="admin-metrics-header">
        <h1 className="admin-metrics-title">
          <span className="admin-badge">ADMIN</span>
          Platform Metrics
        </h1>
        <button className="admin-refresh-btn" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {error && <div className="admin-error-banner">{error}</div>}

      {/* ── Overview ── */}
      {overview && (
        <section className="admin-section">
          <h2 className="admin-section-title">Overview</h2>
          <div className="admin-stat-grid">
            <StatCard label="Total Developers" value={overview.totalDevelopers?.toLocaleString()} />
            <StatCard
              label="Verified Developers"
              value={overview.verifiedDevelopers?.toLocaleString()}
              sub={`${overview.totalDevelopers ? Math.round((overview.verifiedDevelopers / overview.totalDevelopers) * 100) : 0}% verified`}
              accent="#4ade80"
            />
            <StatCard label="Total Projects" value={overview.totalProjects?.toLocaleString()} />
            <StatCard
              label="⭐ North Star (7d)"
              value={overview.activeProjectsLast7d?.toLocaleString()}
              sub="projects with 2xx API calls"
              accent="#a78bfa"
            />
            <StatCard label="Total API Calls (all-time)" value={overview.totalApiCalls?.toLocaleString()} />
          </div>
        </section>
      )}

      {/* ── Activation Funnel ── */}
      {funnel && (
        <section className="admin-section">
          <h2 className="admin-section-title">Activation Funnel (All-time)</h2>
          <div className="admin-funnel">
            {funnel.steps.map((s) => (
              <FunnelBar key={s.step} step={s.step} count={s.uniqueDevs} max={funnelMax} />
            ))}
          </div>
        </section>
      )}

      {/* ── Retention Cohorts ── */}
      <section className="admin-section">
        <h2 className="admin-section-title">Retention Cohorts</h2>
        <div className="admin-cohort-controls">
          <label htmlFor="cohort-month-input">Signup Month</label>
          <input
            id="cohort-month-input"
            type="month"
            value={cohortMonth}
            onChange={(e) => setCohortMonth(e.target.value)}
            className="admin-month-input"
          />
        </div>
        {cohorts ? (
          <div className="admin-stat-grid">
            <StatCard label="Cohort Size" value={cohorts.cohortSize?.toLocaleString()} />
            <StatCard label="D1 Retention" value={`${cohorts.d1Pct ?? 0}%`} sub={`${cohorts.d1} devs`} accent="#38bdf8" />
            <StatCard label="D7 Retention" value={`${cohorts.d7Pct ?? 0}%`} sub={`${cohorts.d7} devs`} accent="#818cf8" />
            <StatCard label="D30 Retention" value={`${cohorts.d30Pct ?? 0}%`} sub={`${cohorts.d30} devs`} accent="#f472b6" />
          </div>
        ) : (
          <p className="admin-empty">No cohort data for {cohortMonth}</p>
        )}
      </section>

      {/* ── Feature Usage ── */}
      {featureUsage && (
        <section className="admin-section">
          <h2 className="admin-section-title">Feature Usage (Last 30 Days)</h2>
          <div className="admin-stat-grid">
            <StatCard label="API Calls" value={featureUsage.totalApiCalls?.toLocaleString()} />
            <StatCard label="Emails Sent" value={featureUsage.totalMailSent?.toLocaleString()} />
            <StatCard label="Storage Uploads" value={featureUsage.totalStorageUploads?.toLocaleString()} />
            <StatCard label="Webhooks Fired" value={featureUsage.totalWebhooksFired?.toLocaleString()} />
            <StatCard label="Active Developers" value={featureUsage.activeDevelopers?.toLocaleString()} />
          </div>
        </section>
      )}

      {/* ── Reliability ── */}
      {reliability && (
        <section className="admin-section">
          <h2 className="admin-section-title">Reliability (Last 24 Hours)</h2>
          <div className="admin-stat-grid">
            <StatCard label="Total Requests" value={reliability.totalRequests?.toLocaleString()} />
            <StatCard
              label="Error Rate"
              value={`${reliability.errorRate}%`}
              accent={parseFloat(reliability.errorRate) > 5 ? '#f87171' : '#4ade80'}
            />
            <StatCard label="p50 Latency" value={reliability.p50Ms ? `${reliability.p50Ms} ms` : '—'} />
            <StatCard label="p95 Latency" value={reliability.p95Ms ? `${reliability.p95Ms} ms` : '—'} />
            <StatCard label="p99 Latency" value={reliability.p99Ms ? `${reliability.p99Ms} ms` : '—'} />
          </div>
        </section>
      )}

      {/* ── Top Projects ── */}
      {topProjects && topProjects.projects.length > 0 && (
        <section className="admin-section">
          <h2 className="admin-section-title">Top Projects (7 Days)</h2>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Project</th>
                  <th>API Calls</th>
                </tr>
              </thead>
              <tbody>
                {topProjects.projects.map((p, i) => (
                  <tr key={p.projectId}>
                    <td className="admin-table-rank">{i + 1}</td>
                    <td>{p.projectName || p.projectId}</td>
                    <td>{p.callCount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Churn Signals ── */}
      {churn && (
        <section className="admin-section">
          <h2 className="admin-section-title">
            Churn Signals
            <span className="admin-churn-badge">{churn.churnSignals} projects</span>
          </h2>
          <p className="admin-section-desc">
            Projects active 14–30 days ago that have made zero API calls in the last 14 days.
          </p>
          {churn.projects.length > 0 ? (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Owner Email</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {churn.projects.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.owner?.email || 'Unknown'}</td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No churn signals detected 🎉</p>
          )}
        </section>
      )}
    </div>
  );
}
