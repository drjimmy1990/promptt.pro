import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

const configFields = [
  { key: 'site_title_line1', label: '📝 عنوان الموقع (سطر 1)', placeholder: 'مولّد' },
  { key: 'site_title_line2', label: '📝 عنوان الموقع (سطر 2)', placeholder: 'البرومبتات الاحترافي' },
  { key: 'subtitle', label: '📄 الوصف الفرعي', placeholder: 'ذكاء اصطناعي حقيقي يكتب برومبتك أمامك حرفاً بحرف' },
  { key: 'badge_text', label: '🏷️ نص البادج', placeholder: 'Claude AI — Abdullah_Ops1' },
  { key: 'brand_name', label: '🏢 اسم العلامة التجارية', placeholder: 'قاعدة AI' },
  { key: 'max_tokens', label: '🔢 الحد الأقصى للتوكنات', placeholder: '1500' },
  { key: 'n8n_webhook_url_override', label: '🔗 رابط n8n Webhook (تجاوز)', placeholder: 'https://your-n8n.com/webhook/generate-prompt' },
  { key: 'base_system_prompt', label: '🤖 System Prompt الأساسي', placeholder: 'You are an expert prompt engineer...', multiline: true, guide: true },
];

const systemPromptGuide = `💡 كيف يعمل System Prompt:

• هذا النص هو التعليمات الأساسية التي تُرسل للذكاء الاصطناعي عبر n8n
• النظام يضيف تلقائياً: النبرة، اللغة، ومستوى التفاصيل بناءً على اختيار المستخدم
• إذا تركت هذا الحقل فارغاً، سيستخدم النظام التعليمات الافتراضية

📋 مثال جاهز للاستخدام:

You are an expert prompt engineer specialized in creating highly optimized, professional prompts for AI platforms.

Your task:
- Take the user's description and transform it into a well-structured, detailed prompt
- Include clear instructions, context, and constraints
- Follow the target platform's best practices
- Make the prompt immediately usable without modifications
- Be specific and avoid vague instructions

Output rules:
- Return ONLY the final prompt text
- No explanations, no markdown, no preamble
- Structure with clear sections when appropriate`;


export default function AdminConfig() {
  const toast = useToast();
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('system_config').select('*');
    if (data) {
      const cfg = {};
      data.forEach(row => { cfg[row.key] = row.value; });
      setConfig(cfg);
    }
    setLoading(false);
  }

  function setField(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      // Upsert each config key
      const rows = Object.entries(config).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from('system_config').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      toast.success('✅ تم حفظ الإعدادات');
    } catch (err) {
      toast.error('❌ ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>⏳ جاري التحميل...</p>;

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>⚙️ إعدادات النظام</h1>
          <p>تعديل النصوص والإعدادات العامة للموقع</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
        </button>
      </div>

      <div className="card">
        {configFields.map(field => (
          <div key={field.key} className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>{field.label}</label>
            {field.multiline ? (
              <textarea
                value={config[field.key] || ''}
                onChange={e => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={8}
              />
            ) : (
              <input
                type="text"
                value={config[field.key] || ''}
                onChange={e => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
            {field.guide && (
              <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', borderRight: '3px solid var(--accent)' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.8, fontFamily: 'inherit', margin: 0 }}>{systemPromptGuide}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
