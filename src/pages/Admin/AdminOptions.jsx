import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';

const groupLabels = {
  platform: '🤖 المنصات',
  output_type: '📋 أنواع المخرجات',
  tone: '🎭 النبرة',
  language: '🌐 اللغة',
  detail: '📏 مستوى التفاصيل',
};

const groupKeys = Object.keys(groupLabels);

export default function AdminOptions() {
  const toast = useToast();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeGroup, setActiveGroup] = useState('platform');
  const [form, setForm] = useState({ group: 'platform', key: '', label: '', is_active: true, sort_order: 0 });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('options').select('*').order('sort_order');
    if (data) setOptions(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ group: activeGroup, key: '', label: '', is_active: true, sort_order: filteredOptions.length });
    setModalOpen(true);
  }

  function openEdit(opt) {
    setEditing(opt);
    setForm({ ...opt });
    setModalOpen(true);
  }

  async function save() {
    const data = { group: form.group, key: form.key, label: form.label, is_active: form.is_active, sort_order: form.sort_order };
    try {
      if (editing) {
        const { error } = await supabase.from('options').update(data).eq('id', editing.id);
        if (error) throw error;
        toast.success('✅ تم التحديث');
      } else {
        const { error } = await supabase.from('options').insert(data);
        if (error) throw error;
        toast.success('✅ تمت الإضافة');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error('❌ ' + err.message);
    }
  }

  async function toggleActive(opt) {
    await supabase.from('options').update({ is_active: !opt.is_active }).eq('id', opt.id);
    load();
  }

  async function deleteOption(opt) {
    if (!confirm('هل أنت متأكد من حذف هذا الخيار؟')) return;
    await supabase.from('options').delete().eq('id', opt.id);
    toast.success('🗑️ تم الحذف');
    load();
  }

  const filteredOptions = options.filter(o => o.group === activeGroup);

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>🏷️ الخيارات</h1>
          <p>إدارة خيارات المنصات، النبرة، اللغة، وغيرها</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>➕ إضافة خيار</button>
      </div>

      {/* Group Tabs */}
      <div className="tags-row" style={{ marginBottom: '1.5rem' }}>
        {groupKeys.map(gk => (
          <span
            key={gk}
            className={`tag ${activeGroup === gk ? 'active' : ''}`}
            onClick={() => setActiveGroup(gk)}
          >
            {groupLabels[gk]}
          </span>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>⏳ جاري التحميل...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>المفتاح</th>
              <th>التسمية</th>
              <th>الترتيب</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredOptions.map(opt => (
              <tr key={opt.id}>
                <td><code style={{ background: 'var(--bg-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{opt.key}</code></td>
                <td style={{ fontWeight: 600 }}>{opt.label}</td>
                <td>{opt.sort_order}</td>
                <td>
                  <span
                    className={`badge-active ${opt.is_active ? 'on' : 'off'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleActive(opt)}
                  >
                    {opt.is_active ? 'مفعّل' : 'معطّل'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => openEdit(opt)}>✏️</button>
                    <button className="btn-icon" onClick={() => deleteOption(opt)} style={{ color: 'var(--danger)' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOptions.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>لا توجد خيارات في هذا التصنيف</td></tr>
            )}
          </tbody>
        </table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '✏️ تعديل خيار' : '➕ إضافة خيار'}>
        <div className="form-group">
          <label>المجموعة</label>
          <select value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))}>
            {groupKeys.map(gk => <option key={gk} value={gk}>{groupLabels[gk]}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>المفتاح (key) — بالإنجليزية</label>
          <input type="text" value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="claude" dir="ltr" />
        </div>
        <div className="form-group">
          <label>التسمية (label)</label>
          <input type="text" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="🤖 Claude" />
        </div>
        <div className="form-group">
          <label>الترتيب</label>
          <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>إلغاء</button>
          <button className="btn btn-primary btn-sm" onClick={save}>💾 حفظ</button>
        </div>
      </Modal>
    </div>
  );
}
