import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalOptions: 0,
    totalHistory: 0,
    avgTime: 0,
    topPlatform: '-',
    todayGenerations: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [tplRes, optRes, histRes] = await Promise.all([
        supabase.from('templates').select('id', { count: 'exact', head: true }),
        supabase.from('options').select('id', { count: 'exact', head: true }),
        supabase.from('prompt_history').select('*').order('created_at', { ascending: false }).limit(500),
      ]);

      const history = histRes.data || [];
      const today = new Date().toDateString();
      const todayCount = history.filter(h => new Date(h.created_at).toDateString() === today).length;

      // Most popular platform
      const platformCounts = {};
      history.forEach(h => { platformCounts[h.platform] = (platformCounts[h.platform] || 0) + 1; });
      const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];

      // Avg generation time
      const times = history.filter(h => h.generation_time_ms).map(h => h.generation_time_ms);
      const avgTime = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1) : 0;

      setStats({
        totalTemplates: tplRes.count || 0,
        totalOptions: optRes.count || 0,
        totalHistory: history.length,
        avgTime,
        topPlatform: topPlatform ? topPlatform[0] : '-',
        todayGenerations: todayCount,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>📊 لوحة التحكم</h1>
          <p>نظرة عامة على النظام والإحصائيات</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="label">📝 عدد القوالب</div>
          <div className="value">{stats.totalTemplates}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">🏷️ عدد الخيارات</div>
          <div className="value">{stats.totalOptions}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">📜 إجمالي التوليدات</div>
          <div className="value">{stats.totalHistory}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">📅 توليدات اليوم</div>
          <div className="value">{stats.todayGenerations}</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">⏱️ متوسط وقت التوليد</div>
          <div className="value">{stats.avgTime}s</div>
        </div>
        <div className="admin-stat-card">
          <div className="label">🏆 المنصة الأكثر استخداماً</div>
          <div className="value" style={{ fontSize: '1.2rem' }}>{stats.topPlatform}</div>
        </div>
      </div>
    </div>
  );
}
