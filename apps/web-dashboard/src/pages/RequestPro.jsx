import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, AlignLeft } from 'lucide-react';

import AuthShell from '../components/AuthShell';
import api from '../utils/api';

function RequestPro() {
  const [formData, setFormData] = useState({
    email: '',
    bio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.bio) {
      toast.error('Email and bio are required.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Submitting your request...');

    try {
      const response = await api.post('/api/billing/request-pro', formData);
      toast.dismiss(loadingToast);
      toast.success(response.data.message);
      setSubmitted(true);
    } catch (error) {
      toast.dismiss(loadingToast);
      const data = error.response?.data;
      let errorMessage = 'Failed to submit request. Please try again.';
      if (typeof data?.error === 'string') errorMessage = data.error;
      else if (data?.message) errorMessage = data.message;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell
        modeLabel="Request Pro Access"
        title="Request Received"
        subtitle="Thank you for your interest! We'll review your use-case and get back to you shortly."
        alternateText="Return to home?"
        alternateLabel="Go back"
        alternateTo="/"
      />
    );
  }

  return (
    <AuthShell
      modeLabel="Request Pro Access"
      title=""
      subtitle="Tell us a little about what you're building."
      alternateText="Return to home?"
      alternateLabel="Go back"
      alternateTo="/"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="request-email">Email Address</label>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              id="request-email"
              type="email"
              name="email"
              className="input-field auth-input"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="request-bio">1-Line Bio / Use Case</label>
          <div className="auth-input-wrap">
            <AlignLeft size={18} />
            <input
              id="request-bio"
              type="text"
              name="bio"
              className="input-field auth-input"
              placeholder="Building an AI SaaS for real estate"
              value={formData.bio}
              onChange={handleChange}
              required
              maxLength={250}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Request Access'}
        </button>
      </form>
    </AuthShell>
  );
}

export default RequestPro;
