import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const u = await signup(name, email, password);
      toast.success(
        u.role === 'Admin'
          ? `Welcome, ${u.name}! You're the Global Admin.`
          : `Welcome, ${u.name}!`
      );
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'Signup failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon big">✓</span>
          <h1>Create your account</h1>
          <p className="auth-tagline">Start managing tasks with your team</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-error">{error}</div>}
          <label>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" />
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
