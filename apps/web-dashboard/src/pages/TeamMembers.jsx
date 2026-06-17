import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserPlus, Crown, Shield, Eye, Trash2, ChevronDown, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ROLE_META = {
  owner: { label: 'Owner', icon: Crown, color: '#f59e0b' },
  admin: { label: 'Admin', icon: Shield, color: '#6366f1' },
  viewer: { label: 'Viewer', icon: Eye, color: '#64748b' },
};

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.viewer;
  const Icon = meta.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
      background: `${meta.color}18`, color: meta.color,
      border: `1px solid ${meta.color}30`,
    }}>
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function Avatar({ name, email }) {
  const initials = (name || email || '?').slice(0, 2).toUpperCase();
  const hue = [...(email || '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue}, 60%, 45%)`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14,
    }}>
      {initials}
    </div>
  );
}

export default function TeamMembers() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviting, setInviting] = useState(false);

  // Pending invitations (from the other direction — sent by this project)
  const [removing, setRemoving] = useState(null);
  const [changingRole, setChangingRole] = useState(null);

  const myMember = members.find(m => m.email === user?.email);
  const myRole = myMember ? myMember.role : null;
  const isOwner = myRole === 'owner';

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get(`/api/projects/${projectId}/members`);
      const list = res.data?.data?.members || [];
      setMembers(list);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembers();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await api.post(`/api/projects/${projectId}/members/invite`, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      toast.success(res.data?.message || 'Invitation sent!');
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId, email) => {
    if (!window.confirm(`Remove ${email} from this project?`)) return;
    setRemoving(memberId);
    try {
      await api.delete(`/api/projects/${projectId}/members/${memberId}`);
      toast.success(`${email} removed`);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    setChangingRole(memberId);
    try {
      await api.patch(`/api/projects/${projectId}/members/${memberId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setChangingRole(null);
    }
  };

  // Simple heuristic: the first entry from backend is owner — to detect if I'm the owner,
  // we would need auth context. For now, show action buttons and let the API enforce.

  return (
    <div style={{ padding: '32px 40px', maxWidth: 820, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Team Members</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Manage who has access to this project
          </p>
        </div>
      </div>

      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 32, marginTop: 16 }} />

      {/* Invite Form */}
      {isOwner && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <UserPlus size={16} color="#6366f1" />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Invite a team member
            </h2>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
            They must already have a urBackend account. An invitation will be sent and they'll accept from their dashboard.
          </p>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="invite-email"
                type="email"
                className="input-field"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
                required
              />
            </div>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="input-field"
              style={{ width: 130, flexShrink: 0 }}
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              id="invite-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={inviting}
              style={{ flexShrink: 0 }}
            >
              {inviting ? <Loader2 size={15} className="spin" /> : <UserPlus size={15} />}
              {inviting ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Current Members
            {!loading && (
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 500,
                background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                padding: '2px 8px', borderRadius: 999,
              }}>
                {members.length}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
            <Loader2 size={24} className="spin" color="var(--text-muted)" />
          </div>
        ) : members.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0 }}>No members yet. Invite someone above.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {members.map((member, idx) => (
              <li
                key={member._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 24px',
                  borderBottom: idx < members.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <Avatar name={member.name} email={member.email} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', truncate: true }}>
                    {member.name || member.email}
                  </div>
                  {member.name && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.email}</div>
                  )}
                </div>

                <RoleBadge role={member.role} />

                {/* Role change dropdown — only for non-owners, non-self, and if current user is owner */}
                {isOwner && member.role !== 'owner' && member._id !== user?._id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <select
                        id={`role-select-${member._id}`}
                        value={member.role}
                        onChange={(e) => handleRoleChange(member._id, e.target.value)}
                        disabled={changingRole === member._id}
                        className="input-field"
                        style={{ fontSize: 12, padding: '4px 28px 4px 10px', height: 'auto', minWidth: 90 }}
                      >
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <button
                      id={`remove-member-${member._id}`}
                      onClick={() => handleRemove(member._id, member.email)}
                      disabled={removing === member._id}
                      title="Remove member"
                      style={{
                        background: 'none', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      {removing === member._id
                        ? <Loader2 size={14} className="spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Free plan: up to 2 members · Pro plan: up to 6 members
      </p>
    </div>
  );
}
