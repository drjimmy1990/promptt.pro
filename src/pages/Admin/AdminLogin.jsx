import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid-bg" />
      <div className="ambient" />
      <div className="login-container" dir="rtl">
        <div className="login-card">
          <div className="badge" style={{ marginBottom: '1.5rem' }}>
            <span className="live-dot" />
            لوحة التحكم
          </div>
          <h1>تسجيل الدخول</h1>
          <p>أدخل بيانات المسؤول للوصول إلى لوحة التحكم</p>

          {error && <div className="error-box show" style={{ textAlign: 'right', marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>📧 البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required />
            </div>
            <div className="form-group">
              <label>🔒 كلمة المرور</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ جاري الدخول...' : '🔑 دخول'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
