-- ═══════════════════════════════════════════════════════════════
-- Prompt Generator — Supabase Schema & Seed Data
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────
-- 1. TABLES
-- ──────────────────────────────

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  raw_prompt TEXT NOT NULL,
  platform TEXT DEFAULT 'claude',
  output_type TEXT DEFAULT 'text',
  tone TEXT DEFAULT 'professional',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Options (dynamic tags)
CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "group" TEXT NOT NULL, -- platform, output_type, tone, language, detail
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System Config (key-value store)
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt History
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input TEXT,
  generated_prompt TEXT,
  platform TEXT,
  tone TEXT,
  tokens_used INT DEFAULT 0,
  generation_time_ms INT DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────
-- 2. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

-- Public can READ categories, templates, options, system_config
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read templates" ON templates FOR SELECT USING (true);
CREATE POLICY "Public read options" ON options FOR SELECT USING (true);
CREATE POLICY "Public read system_config" ON system_config FOR SELECT USING (true);

-- Public can INSERT into prompt_history (anonymous usage tracking)
CREATE POLICY "Public insert history" ON prompt_history FOR INSERT WITH CHECK (true);

-- Authenticated users (admin) can do EVERYTHING
CREATE POLICY "Admin full access categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access templates" ON templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access options" ON options FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access system_config" ON system_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access history" ON prompt_history FOR ALL USING (auth.role() = 'authenticated');

-- ──────────────────────────────
-- 3. SEED DATA
-- ──────────────────────────────

-- Categories
INSERT INTO categories (name, icon, sort_order) VALUES
  ('كتابة', '✍️', 0),
  ('برمجة', '💻', 1),
  ('تصميم', '🎨', 2),
  ('بيانات', '📊', 3),
  ('أعمال', '💼', 4);

-- Options: Platforms
INSERT INTO options ("group", key, label, sort_order) VALUES
  ('platform', 'claude', 'Claude', 0),
  ('platform', 'chatgpt', 'ChatGPT', 1),
  ('platform', 'gemini', 'Gemini', 2),
  ('platform', 'perplexity', 'Perplexity', 3),
  ('platform', 'midjourney', 'Midjourney', 4),
  ('platform', 'dalle', 'DALL-E', 5),
  ('platform', 'stable-diffusion', 'Stable Diffusion', 6);

-- Options: Output Types
INSERT INTO options ("group", key, label, sort_order) VALUES
  ('output_type', 'text', '📝 نص', 0),
  ('output_type', 'code', '💻 كود', 1),
  ('output_type', 'image', '🎨 صورة', 2),
  ('output_type', 'data', '📊 بيانات', 3),
  ('output_type', 'creative', '✨ إبداعي', 4),
  ('output_type', 'casestudy', '🔍 دراسة حالة', 5),
  ('output_type', 'feasibility', '💼 دراسة جدوى', 6),
  ('output_type', 'business', '🚀 فكرة مشروع', 7);

-- Options: Tones
INSERT INTO options ("group", key, label, sort_order) VALUES
  ('tone', 'professional', '👔 احترافي', 0),
  ('tone', 'creative', '✨ إبداعي', 1),
  ('tone', 'educational', '🎓 تعليمي', 2),
  ('tone', 'friendly', '😊 ودّي', 3),
  ('tone', 'formal', '📜 رسمي', 4),
  ('tone', 'motivational', '🔥 حماسي', 5),
  ('tone', 'technical', '🔧 تقني', 6),
  ('tone', 'storytelling', '📖 قصصي', 7);

-- Options: Languages
INSERT INTO options ("group", key, label, sort_order) VALUES
  ('language', 'arabic', '🇸🇦 عربي', 0),
  ('language', 'english', '🇺🇸 إنجليزي', 1),
  ('language', 'both', '🌍 ثنائي', 2);

-- Options: Detail Levels
INSERT INTO options ("group", key, label, sort_order) VALUES
  ('detail', 'brief', '⚡ مختصر', 0),
  ('detail', 'moderate', '📝 متوسط', 1),
  ('detail', 'detailed', '📚 مفصّل جداً', 2);

-- Templates
INSERT INTO templates (icon, title, description, raw_prompt, platform, output_type, tone, sort_order) VALUES
  ('✍️', 'مقال احترافي', 'مقال SEO-friendly كامل', 'اكتب مقال احترافي عن [موضوعك] بطول 1000-1500 كلمة، مع مقدمة جذابة، 5 نقاط رئيسية، وخاتمة قوية', 'claude', 'text', 'professional', 0),
  ('💻', 'كود Python', 'سكريبت موثق ونظيف', 'اكتب كود Python كامل ل [وصف المهمة]، مع تعليقات توضيحية، معالجة للأخطاء، وأمثلة استخدام', 'claude', 'code', 'technical', 1),
  ('🎨', 'صورة واقعية', 'Prompt لـ Midjourney/DALL-E', 'صورة واقعية hyperrealistic ل [وصف الصورة]، إضاءة سينمائية، تفاصيل عالية، 8K resolution', 'midjourney', 'image', 'creative', 2),
  ('📊', 'تحليل بيانات', 'رؤى وتوصيات قابلة للتنفيذ', 'حلل هذه البيانات [وصف البيانات] واستخرج رؤى قابلة للتنفيذ مع توصيات واضحة', 'claude', 'data', 'professional', 3),
  ('📧', 'إيميل رسمي', 'رسالة احترافية جاهزة', 'اكتب إيميل رسمي ل [المستلم] بخصوص [الموضوع]، بأسلوب احترافي ومباشر', 'chatgpt', 'text', 'formal', 4),
  ('📱', 'بوست تواصل', 'محتوى جذاب لـ X/LinkedIn', 'اكتب بوست جذاب لـ [منصة] عن [الموضوع]، مع hook قوي وcall-to-action', 'claude', 'text', 'creative', 5);

-- System Config
INSERT INTO system_config (key, value) VALUES
  ('site_title_line1', 'مولّد'),
  ('site_title_line2', 'البرومبتات الاحترافي'),
  ('subtitle', 'ذكاء اصطناعي حقيقي يكتب برومبتك أمامك حرفاً بحرف'),
  ('badge_text', 'Claude AI — Abdullah_Ops1'),
  ('brand_name', 'قاعدة AI'),
  ('max_tokens', '1500'),
  ('base_system_prompt', '');
