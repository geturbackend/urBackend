import { Link } from 'react-router-dom';

function AuthShell({
  modeLabel,
  title,
  subtitle,
  alternateLabel,
  alternateTo,
  alternateText,
  children,
  onModeClick,
}) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__ambient auth-shell__ambient--one" />
      <div className="auth-shell__ambient auth-shell__ambient--two" />

      <div className="auth-shell__content">
        <div className="auth-form-card">
          <div className="auth-form-card__brand">
            <div className="auth-form-card__brand-mark">U</div>
            <span className="auth-form-card__brand-text">urBackend</span>
          </div>

          <div className="auth-form-card__header">
            {modeLabel && (
              onModeClick ? (
                <button
                  type="button"
                  className="auth-form-card__mode auth-form-card__mode--clickable"
                  onClick={onModeClick}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {modeLabel}
                </button>
              ) : (
                <span className="auth-form-card__mode">{modeLabel}</span>
              )
            )}
            {title ? <h1>{title}</h1> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          {children}

          <div className="auth-form-card__footer">
            <span>{alternateText}</span>
            <Link to={alternateTo}>{alternateLabel}</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AuthShell;
