import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, Check, Loader2 } from 'lucide-react';
// import api from '../utils/api';
// import toast from 'react-hot-toast';
// import { useAuth } from '../context/AuthContext';

const FREE_FEATURES = [
    '1 Project',
    '5 Collections per project',
    '2,000 API requests / day',
    '10MB File Storage',
    '200 Auth Users',
    '25 Emails / month',
    'Global email templates',
    'Community support',
];

const PRO_FEATURES = [
    '10 Projects',
    'Unlimited collections',
    'Unlimited API requests',
    'Unlimited Auth Users',
    'Unlimited Webhooks',
    'External Database (BYOM)',
    'Bring your own Storage (S3/R2)',
    '1,000 Emails / month',
    'Custom HTML email templates',
    'BYOK — own API keys',
    'Analytics Pro',
    'AI integrations (OpenAI, Groq)',
    'Priority support',
];

export default function UpgradeModal({ isOpen, onClose }) {
    const [isLoading] = useState(false); // setIsLoading removed to fix lint error (unused)
    const navigate = useNavigate();
    // const { user } = useAuth(); // Removed to fix lint error (unused)

    if (!isOpen) return null;

    /*
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };
    */

    const handleUpgrade = async () => {
        // BETA TOGGLE: Route users to manual request instead of Razorpay
        onClose();
        navigate('/request-pro');
        return;

        /*
        // Code below is disabled during Public Beta
        setIsLoading(true);
        try {
            const res = await api.post('/api/billing/checkout');
            const { subscriptionId, keyId } = res.data?.data || {};

            if (!res.data?.success || !subscriptionId || !keyId) {
                toast.error('Could not start checkout. Please try again.');
                setIsLoading(false);
                return;
            }

            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                toast.error('Failed to load payment gateway. Please check your internet connection.');
                setIsLoading(false);
                return;
            }

            const options = {
                key: keyId,
                subscription_id: subscriptionId,
                name: 'urBackend',
                description: 'urBackend Pro Subscription',
                handler: function () {
                    toast.success('Payment successful! Upgrading your account...');
                    onClose();
                    navigate('/billing/success');
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                },
                theme: {
                    color: '#7B61FF',
                },
                modal: {
                    ondismiss: function () {
                        setIsLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(response.error.description || 'Payment failed.');
                setIsLoading(false);
            });
            rzp.open();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Checkout failed. Please try again.';
            toast.error(msg);
            setIsLoading(false);
        }
        */
    };

    return (
        <div
            id="upgrade-modal-overlay"
            onClick={(e) => e.target.id === 'upgrade-modal-overlay' && onClose()}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <div style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                width: '100%', maxWidth: '780px',
                padding: '2rem',
                position: 'relative',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            }}>
                {/* Close button */}
                <button
                    id="upgrade-modal-close"
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)', padding: '4px',
                        borderRadius: '6px', display: 'flex', alignItems: 'center',
                    }}
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, #7B61FF22, #00C2FF22)',
                        border: '1px solid #7B61FF44',
                        borderRadius: '100px', padding: '6px 14px',
                        marginBottom: '1rem',
                    }}>
                        <Zap size={14} color="#7B61FF" />
                        <span style={{ fontSize: '0.75rem', color: '#7B61FF', fontWeight: 600 }}>
                            Get 1 month Pro for free (Beta)
                        </span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                        Get 1 month of Pro for free to test out urBackend
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        Help us test the platform during our beta phase and get full access to all Pro features.
                    </p>
                </div>

                {/* Plan comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    {/* Free Column */}
                    <div style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px', padding: '1.25rem',
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Free
                            </span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>$0 <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/mo</span></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {FREE_FEATURES.map((f) => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                    <Check size={13} color="#22c55e" />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Column */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.08), rgba(0, 194, 255, 0.05))',
                        border: '1px solid #7B61FF55',
                        borderRadius: '12px', padding: '1.25rem',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'linear-gradient(135deg, #7B61FF, #00C2FF)',
                            color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                            padding: '2px 8px', borderRadius: '100px',
                        }}>
                            RECOMMENDED
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#7B61FF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Pro
                            </span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>$0 <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/mo</span></div>
                            <p style={{ fontSize: '0.75rem', color: '#7B61FF', fontWeight: 500, margin: '8px 0 0 0' }}>
                                Get a month free to test out app before launch!
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {PRO_FEATURES.map((f) => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                                    <Check size={13} color="#7B61FF" />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div style={{ textAlign: 'center' }}>
                    <button
                        id="upgrade-modal-cta"
                        onClick={handleUpgrade}
                        disabled={isLoading}
                        style={{
                            background: 'linear-gradient(135deg, #7B61FF, #00C2FF)',
                            color: '#fff', border: 'none', borderRadius: '10px',
                            padding: '0.75rem 2.5rem', fontSize: '0.95rem', fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                        {isLoading ? 'Redirecting...' : 'Get 1 Month Pro for Free (Beta)'}
                    </button>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Billed monthly · Cancel anytime
                    </p>
                </div>
            </div>
        </div>
    );
}
