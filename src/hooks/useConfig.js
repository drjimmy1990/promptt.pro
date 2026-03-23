import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to load all public configuration from Supabase.
 * Returns templates, options (grouped by type), and system config.
 * Falls back to default data if Supabase is not configured.
 */
export function useConfig() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState({
    platform: [],
    output_type: [],
    tone: [],
    language: [],
    detail: [],
  });
  const [systemConfig, setSystemConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      // Load all in parallel
      const [catRes, tplRes, optRes, cfgRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('templates').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('options').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('system_config').select('*'),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (tplRes.data) setTemplates(tplRes.data);

      if (optRes.data) {
        const grouped = { platform: [], output_type: [], tone: [], language: [], detail: [] };
        optRes.data.forEach(opt => {
          if (grouped[opt.group]) grouped[opt.group].push(opt);
        });
        setOptions(grouped);
      }

      if (cfgRes.data) {
        const cfg = {};
        cfgRes.data.forEach(row => { cfg[row.key] = row.value; });
        setSystemConfig(cfg);
      }
    } catch (err) {
      console.warn('Failed to load config from Supabase, using defaults:', err.message);
      loadDefaults();
    } finally {
      setLoading(false);
    }
  }

  function loadDefaults() {
    setOptions({
      platform: [
        { key: 'claude', label: 'Claude' },
        { key: 'chatgpt', label: 'ChatGPT' },
        { key: 'gemini', label: 'Gemini' },
        { key: 'perplexity', label: 'Perplexity' },
        { key: 'midjourney', label: 'Midjourney' },
        { key: 'dalle', label: 'DALL-E' },
        { key: 'stable-diffusion', label: 'Stable Diffusion' },
      ],
      output_type: [
        { key: 'text', label: '📝 نص' },
        { key: 'code', label: '💻 كود' },
        { key: 'image', label: '🎨 صورة' },
        { key: 'data', label: '📊 بيانات' },
        { key: 'creative', label: '✨ إبداعي' },
        { key: 'casestudy', label: '🔍 دراسة حالة' },
        { key: 'feasibility', label: '💼 دراسة جدوى' },
        { key: 'business', label: '🚀 فكرة مشروع' },
      ],
      tone: [
        { key: 'professional', label: '👔 احترافي' },
        { key: 'creative', label: '✨ إبداعي' },
        { key: 'educational', label: '🎓 تعليمي' },
        { key: 'friendly', label: '😊 ودّي' },
        { key: 'formal', label: '📜 رسمي' },
        { key: 'motivational', label: '🔥 حماسي' },
        { key: 'technical', label: '🔧 تقني' },
        { key: 'storytelling', label: '📖 قصصي' },
      ],
      language: [
        { key: 'arabic', label: '🇸🇦 عربي' },
        { key: 'english', label: '🇺🇸 إنجليزي' },
        { key: 'both', label: '🌍 ثنائي' },
      ],
      detail: [
        { key: 'brief', label: '⚡ مختصر' },
        { key: 'moderate', label: '📝 متوسط' },
        { key: 'detailed', label: '📚 مفصّل جداً' },
      ],
    });

    setTemplates([
      { id: 'writing-article', icon: '✍️', title: 'مقال احترافي', description: 'مقال SEO-friendly كامل', raw_prompt: 'اكتب مقال احترافي عن [موضوعك] بطول 1000-1500 كلمة، مع مقدمة جذابة، 5 نقاط رئيسية، وخاتمة قوية', platform: 'claude', output_type: 'text', tone: 'professional' },
      { id: 'code-python', icon: '💻', title: 'كود Python', description: 'سكريبت موثق ونظيف', raw_prompt: 'اكتب كود Python كامل ل [وصف المهمة]، مع تعليقات توضيحية، معالجة للأخطاء، وأمثلة استخدام', platform: 'claude', output_type: 'code', tone: 'technical' },
      { id: 'image-realistic', icon: '🎨', title: 'صورة واقعية', description: 'Prompt لـ Midjourney/DALL-E', raw_prompt: 'صورة واقعية hyperrealistic ل [وصف الصورة]، إضاءة سينمائية، تفاصيل عالية، 8K resolution', platform: 'midjourney', output_type: 'image', tone: 'creative' },
      { id: 'data-analysis', icon: '📊', title: 'تحليل بيانات', description: 'رؤى وتوصيات قابلة للتنفيذ', raw_prompt: 'حلل هذه البيانات [وصف البيانات] واستخرج رؤى قابلة للتنفيذ مع توصيات واضحة', platform: 'claude', output_type: 'data', tone: 'professional' },
      { id: 'email-business', icon: '📧', title: 'إيميل رسمي', description: 'رسالة احترافية جاهزة', raw_prompt: 'اكتب إيميل رسمي ل [المستلم] بخصوص [الموضوع]، بأسلوب احترافي ومباشر', platform: 'chatgpt', output_type: 'text', tone: 'formal' },
      { id: 'social-post', icon: '📱', title: 'بوست تواصل', description: 'محتوى جذاب لـ X/LinkedIn', raw_prompt: 'اكتب بوست جذاب لـ [منصة] عن [الموضوع]، مع hook قوي وcall-to-action', platform: 'claude', output_type: 'text', tone: 'creative' },
    ]);

    setSystemConfig({
      site_title: 'مولّد البرومبتات الاحترافي',
      max_tokens: '1500',
    });
  }

  return { templates, categories, options, systemConfig, loading, reload: loadConfig };
}
