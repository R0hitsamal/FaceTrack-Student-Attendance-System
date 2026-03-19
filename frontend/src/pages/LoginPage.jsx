import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const res = await login(form.email, form.password);
    if (res.success) {
      addToast('Welcome back!', 'success');
      navigate('/dashboard');
    } else {
      setErr(res.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow" />
      <div className="login-card card">
        <div className="login-logo">
          <div className="login-logo-mark" />
          <span>FaceTrack</span>
        </div>
        <h1 className="login-title">Admin Login</h1>
        <p className="login-sub">Access the attendance management dashboard</p>

        <form onSubmit={submit} className="login-form">
          {err && <div className="login-error">{err}</div>}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" name="email" placeholder="admin@facetrack.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handle} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="login-hint">Default: admin@facetrack.com / Admin@123<br/>(Call <code>POST /api/auth/seed</code> to create)</p>
      </div>
    </div>
  );
}
