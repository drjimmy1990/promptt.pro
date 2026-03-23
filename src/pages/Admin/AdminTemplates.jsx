import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';

const emptyTemplate = { icon: '', title: '', description: '', raw_prompt: '', platform: 'claude', output_type: 'text', tone: 'professional', is_active: true, sort_order: 0 };

export default function AdminTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyTemplate });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [tplRes, catRes] = await Promise.all([
      supabase.from('templates').select('*').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    if (tplRes.data) setTemplates(tplRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyTemplate, sort_order: templates.length });
    setModalOpen(true);
  }

  function openEdit(tpl) {
    setEditing(tpl);
    setForm({ ...tpl });
    setModalOpen(true);
  }

  async function save() {
    const data = { ...form };
    delete data.id;
    delete data.created_at;

    try {
      if (editing) {
        const { error } = await supabase.from('templates').update(data).eq('id', editing.id);
        if (error) throw error;
        toast.success('✅ تم تحديث القالب');
      } else {
        const { error } = await supabase.from('templates').insert(data);
        if (error) throw error;
        toast.success('✅ تم إضافة القالب');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error('❌ ' + err.message);
    }
  }

  async function toggleActive(tpl) {
    await supabase.from('templates').update({ is_active: !tpl.is_active }).eq('id', tpl.id);
    load();
  }

  async function deleteTemplate(tpl) {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    await supabase.from('templates').delete().eq('id', tpl.id);
    toast.success('🗑️ تم الحذف');
    load();
  }

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>📝 القوالب</h1>
          <p>إدارة قوالب البرومبتات الجاهزة</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>➕ إضافة قالب</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>⏳ جاري التحميل...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>الأيقونة</th>
              <th>العنوان</th>
              <th>الوصف</th>
              <th>المنصة</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(tpl => (
              <tr key={tpl.id}>
                <td style={{ fontSize: '1.5rem' }}>{tpl.icon}</td>
                <td style={{ fontWeight: 600 }}>{tpl.title}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tpl.description}</td>
                <td>{tpl.platform}</td>
                <td>
                  <span
                    className={`badge-active ${tpl.is_active ? 'on' : 'off'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleActive(tpl)}
                  >
                    {tpl.is_active ? 'مفعّل' : 'معطّل'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => openEdit(tpl)}>✏️</button>
                    <button className="btn-icon" onClick={() => deleteTemplate(tpl)} style={{ color: 'var(--danger)' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '✏️ تعديل القالب' : '➕ إضافة قالب'}>
        <div className="form-group">
          <label>الأيقونة (Emoji)</label>
          <input type="text" value={form.icon} onChange={e => setField('icon', e.target.value)} placeholder="✍️" />
        </div>
        <div className="form-group">
          <label>العنوان</label>
          <input type="text" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="مقال احترافي" />
        </div>
        <div className="form-group">
          <label>الوصف</label>
          <input type="text" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="مقال SEO-friendly كامل" />
        </div>
        <div className="form-group">
          <label>نص البرومبت</label>
          <textarea value={form.raw_prompt} onChange={e => setField('raw_prompt', e.target.value)} placeholder="اكتب مقال احترافي عن [موضوعك]..." rows={4} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label>المنصة</label>
            <input type="text" value={form.platform} onChange={e => setField('platform', e.target.value)} />
          </div>
          <div className="form-group">
            <label>نوع المخرج</label>
            <input type="text" value={form.output_type} onChange={e => setField('output_type', e.target.value)} />
          </div>
          <div className="form-group">
            <label>النبرة</label>
            <input type="text" value={form.tone} onChange={e => setField('tone', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>الترتيب</label>
          <input type="number" value={form.sort_order} onChange={e => setField('sort_order', parseInt(e.target.value) || 0)} />
        </div>
        <div className="form-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>إلغاء</button>
          <button className="btn btn-primary btn-sm" onClick={save}>💾 حفظ</button>
        </div>
      </Modal>
    </div>
  );
}
