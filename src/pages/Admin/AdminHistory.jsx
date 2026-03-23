import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function AdminHistory() {
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('prompt_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setHistory(data);
    setLoading(false);
  }

  async function toggleFavorite(item) {
    await supabase.from('prompt_history').update({ is_favorite: !item.is_favorite }).eq('id', item.id);
    load();
  }

  async function deleteItem(item) {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    await supabase.from('prompt_history').delete().eq('id', item.id);
    toast.success('🗑️ تم الحذف');
    load();
  }

  async function clearAll() {
    if (!confirm('⚠️ هل أنت متأكد من حذف جميع السجلات؟ لا يمكن التراجع!')) return;
    await supabase.from('prompt_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    toast.success('🧹 تم مسح السجل');
    load();
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => toast.success('✅ تم النسخ!'));
  }

  const filtered = history.filter(h =>
    !search || h.user_input?.toLowerCase().includes(search.toLowerCase()) || h.generated_prompt?.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>📜 سجل التوليدات</h1>
          <p>جميع البرومبتات التي تم توليدها ({history.length} سجل)</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={clearAll}>🧹 مسح الكل</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 ابحث في السجل..."
          style={{ maxWidth: '400px' }}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>⏳ جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          📭 لا توجد سجلات
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(item => (
            <div key={item.id} className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    {item.user_input?.slice(0, 100)}{item.user_input?.length > 100 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>📅 {formatDate(item.created_at)}</span>
                    <span>🤖 {item.platform}</span>
                    <span>⏱️ {item.generation_time_ms ? (item.generation_time_ms / 1000).toFixed(1) + 's' : '-'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button className="btn-icon" onClick={e => { e.stopPropagation(); toggleFavorite(item); }} style={{ color: item.is_favorite ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {item.is_favorite ? '⭐' : '☆'}
                  </button>
                  <button className="btn-icon" onClick={e => { e.stopPropagation(); copyText(item.generated_prompt); }}>📋</button>
                  <button className="btn-icon" onClick={e => { e.stopPropagation(); deleteItem(item); }} style={{ color: 'var(--danger)' }}>🗑️</button>
                </div>
              </div>

              {expandedId === item.id && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', fontSize: '0.82rem', lineHeight: 1.8, maxHeight: '300px', overflowY: 'auto' }}>
                  {item.generated_prompt}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
