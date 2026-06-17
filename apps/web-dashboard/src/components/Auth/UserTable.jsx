import React from 'react';
import { User, Mail, Monitor, Edit2, Key, Trash2 } from 'lucide-react';

const UserTable = ({ users, isViewer, onOpenSessions, onEdit, onResetPassword, onDelete }) => {
  if (users.length === 0) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <p>No users found matching your search.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>User</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>User ID</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Created</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="user-row" style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
              <td style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                    <User size={14} color="var(--color-text-muted)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{user.email}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{user.username || 'no-username'}</span>
                  </div>
                </div>
              </td>
              <td style={{ padding: '10px 16px' }}>
                <code style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px' }}>{user._id}</code>
              </td>
              <td style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : 'N/A'}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                  {!isViewer && (
                    <>
                      <button onClick={() => onOpenSessions(user)} className="btn-icon-sm" title="Sessions"><Monitor size={14} /></button>
                      <button onClick={() => onEdit(user._id)} className="btn-icon-sm" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => onResetPassword(user)} className="btn-icon-sm" title="Reset Pass" style={{ color: 'var(--color-primary)' }}><Key size={14} /></button>
                      <button onClick={() => onDelete(user._id)} className="btn-icon-sm" title="Delete" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .user-row:hover { background: rgba(255,255,255,0.01); }
        .btn-icon-sm { 
          background: none; border: none; padding: 6px; border-radius: 4px; 
          cursor: pointer; color: var(--color-text-muted); display: flex; transition: all 0.2s;
        }
        .btn-icon-sm:hover { background: rgba(255,255,255,0.05); color: #fff; }
      `}</style>
    </div>
  );
};

export default UserTable;
