import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';
import { Terminal } from 'lucide-react';

function Signup() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Email and password are required!');
            return;
        }

        const loadingToast = toast.loading('Creating your account...');

        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, formData);

            toast.dismiss(loadingToast);
            toast.success(response.data.message);

            // Redirect to OTP verification page, which automatically sends the OTP
            navigate('/verify-otp', { state: { email: formData.email } });

        } catch (err) {
            toast.dismiss(loadingToast);
            const data = err.response?.data;
            let errorMessage = 'Signup failed. Please try again.';

            if (data?.error) {
                if (typeof data.error === 'string') {
                    errorMessage = data.error;
                } else if (Array.isArray(data.error)) {
                    errorMessage = data.error[0]?.message || 'Validation failed';
                } else {
                    errorMessage = JSON.stringify(data.error);
                }
            }

            toast.error(errorMessage);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '1rem',
            background: 'radial-gradient(circle at top center, #1a1a1a 0%, #000000 100%)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Terminal size={24} color="var(--color-text-main)" />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        Create Account
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Start your developer journey
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ fontSize: '0.9rem' }}>Full Name (Optional)</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="John Doe"
                            style={{
                                padding: '12px',
                                background: 'var(--color-bg-input)',
                                border: '1px solid var(--color-border)',
                                color: '#fff'
                            }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ fontSize: '0.9rem' }}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="name@example.com"
                            required
                            style={{
                                padding: '12px',
                                background: 'var(--color-bg-input)',
                                border: '1px solid var(--color-border)',
                                color: '#fff'
                            }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Min. 6 characters"
                            required
                            minLength={6}
                            style={{
                                padding: '12px',
                                background: 'var(--color-bg-input)',
                                border: '1px solid var(--color-border)',
                                color: '#fff'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            justifyContent: 'center',
                            marginTop: '0.5rem'
                        }}
                    >
                        Sign Up
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;