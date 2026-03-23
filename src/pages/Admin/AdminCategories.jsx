import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '', sort_order: 0 });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', icon: '', sort_order: categories.length });
    setModalOpen(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, sort_order: cat.sort_order });
    setModalOpen(true);
  }

  async function save() {
    const data = { ...form };
    try {
      if (editing) {
        const { error } = await supabase.from('categories').update(data).eq('id', editing.id);
        if (error) throw error;
        toast.success('✅ تم التحديث');
      } else {
        const { error } = await supabase.from('categories').insert(data);
        if (error) throw error;
        toast.success('✅ تمت الإضافة');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error('❌ ' + err.message);
    }
  }

  async function deleteCategory(cat) {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    await supabase.from('categories').delete().eq('id', cat.id);
    toast.success('🗑️ تم الحذف');
    load();
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>📁 التصنيفات</h1>
          <p>إدارة تصنيفات القوالب</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>➕ إضافة تصنيف</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>⏳ جاري التحميل...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>الأيقونة</th>
              <th>الاسم</th>
              <th>الترتيب</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td style={{ fontSize: '1.5rem' }}>{cat.icon}</td>
                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                <td>{cat.sort_order}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => openEdit(cat)}>✏️</button>
                    <button className="btn-icon" onClick={() => deleteCategory(cat)} style={{ color: 'var(--danger)' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '✏️ تعديل التصنيف' : '➕ إضافة تصنيف'}>
        <div className="form-group">
          <label>الأيقونة (Emoji)</label>
          <input type="text" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="📁" />
        </div>
        <div className="form-group">
          <label>الاسم</label>
          <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="كتابة" />
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
