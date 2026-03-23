import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/admin', label: '📊 لوحة التحكم', end: true },
  { to: '/admin/templates', label: '📝 القوالب' },
  { to: '/admin/categories', label: '📁 التصنيفات' },
  { to: '/admin/options', label: '🏷️ الخيارات' },
  { to: '/admin/config', label: '⚙️ إعدادات النظام' },
  { to: '/admin/history', label: '📜 السجل' },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        ⏳ جاري التحميل...
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="grid-bg" />
      <div className="admin-layout" dir="rtl">
        <aside className="admin-sidebar">
          <div className="logo">
            <h2>⚡ لوحة التحكم</h2>
            <p>{user.email}</p>
          </div>
          <nav>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '1rem 1.25rem', marginTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-secondary btn-full btn-sm" onClick={logout}>🚪 تسجيل الخروج</button>
          </div>
          <div style={{ padding: '0 1.25rem', marginTop: '0.5rem' }}>
            <NavLink to="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>← العودة للموقع</NavLink>
          </div>
        </aside>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
