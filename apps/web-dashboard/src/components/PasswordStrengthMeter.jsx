import { useEffect, useMemo } from 'react';
import zxcvbn from 'zxcvbn';

const MIN_SCORE = 2;

const SCORE_CONFIG = [
  { label: 'Very weak', color: 'var(--color-danger)' },
  { label: 'Weak',      color: '#f97316' },
  { label: 'Fair',      color: '#facc15' },
  { label: 'Strong',    color: 'var(--color-primary)' },
  { label: 'Very strong', color: 'var(--color-primary)' },
];

function buildUserInputs(userInputs) {
  const values = (userInputs || []).filter(Boolean).map((v) => String(v));
  const tokens = values.flatMap((v) => v.split(/[\s@.+_-]+/));
  return [...new Set([...values, ...tokens])].filter((v) => v.length > 2);
}

function PasswordStrengthMeter({ password, userInputs, onStrengthChange }) {
  const result = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password, buildUserInputs(userInputs));
  }, [password, userInputs]);

  useEffect(() => {
    if (!onStrengthChange) return;
    if (!result) {
      onStrengthChange({ score: 0, isStrongEnough: false });
      return;
    }
    onStrengthChange({
      score: result.score,
      isStrongEnough: result.score >= MIN_SCORE,
    });
  }, [result, onStrengthChange]);

  if (!password) return null;

  const { score, feedback } = result;
  const config = SCORE_CONFIG[score];
  const barWidth = ((score + 1) / 5) * 100;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {/* Strength bar */}
      <div style={{
        height: '4px',
        borderRadius: '2px',
        background: 'var(--color-border)',
        overflow: 'hidden',
        marginBottom: '0.4rem',
      }}>
        <div style={{
          height: '100%',
          width: `${barWidth}%`,
          background: config.color,
          borderRadius: '2px',
          transition: 'width 0.3s ease, background 0.3s ease',
        }} />
      </div>

      {/* Score label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: feedback.warning || feedback.suggestions?.length ? '0.4rem' : 0,
      }}>
        <span style={{ fontSize: '0.78rem', color: config.color, fontWeight: 600 }}>
          {config.label}
        </span>
        {score < MIN_SCORE && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Too weak to submit
          </span>
        )}
      </div>

      {/* Warning */}
      {feedback.warning && (
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 0.25rem' }}>
          {feedback.warning}
        </p>
      )}

      {/* Suggestions */}
      {feedback.suggestions?.length > 0 && (
        <ul style={{ margin: 0, padding: '0 0 0 1rem' }}>
          {feedback.suggestions.map((s) => (
            <li key={s} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
