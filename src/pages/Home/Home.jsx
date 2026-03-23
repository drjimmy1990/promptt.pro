import { useState, useRef, useCallback } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { generateViaN8n } from '../../lib/n8n';
import { supabase } from '../../lib/supabase';
import { SkeletonTags, SkeletonCard } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

const platformNames = {
  claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini',
  perplexity: 'Perplexity', midjourney: 'Midjourney',
  dalle: 'DALL-E', 'stable-diffusion': 'Stable Diffusion',
};

const tipsData = {
  claude: ['استخدم XML tags للمهام المعقدة', 'اطلب التفكير خطوة بخطوة', 'Claude يفهم السياق الطويل', 'Few-shot examples تحسّن النتائج'],
  chatgpt: ['ابدأ بـ system message', 'استخدم step by step', 'حدد طول الإجابة', 'Temperature منخفضة للدقة'],
  gemini: ['استفد من البحث المدمج', 'Multimodal prompts', 'حدد نسخة الموديل', 'جرب reasoning modes'],
  perplexity: ['اطلب مصادر محدثة', 'حدد نوع البحث', 'Follow-up للتعمق', 'استفد من المراجع'],
  midjourney: ['--v 6 للأحدث', '--ar 16:9 للنسبة', 'cinematic, photorealistic', '--stylize للإبداع'],
  dalle: ['صف التكوين بدقة', 'حدد الأسلوب الفني', 'أوصاف بصرية تفصيلية', 'جرب variations'],
  'stable-diffusion': ['Negative prompts مهمة', 'حدد sampler و steps', 'LoRA للأساليب', 'CFG 7-12'],
};

export default function Home() {
  const { templates, options, systemConfig, loading } = useConfig();
  const toast = useToast();

  const [config, setConfig] = useState({
    platform: 'claude',
    outputType: 'text',
    tone: 'professional',
    language: 'arabic',
    detail: 'moderate',
  });

  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, platform: '-', time: '-' });
  const [error, setError] = useState('');

  const controllerRef = useRef(null);
  const startTimeRef = useRef(null);
  const resultBoxRef = useRef(null);

  const setOption = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  function applyTemplate(t) {
    setUserInput(t.raw_prompt);
    if (t.platform) setOption('platform', t.platform);
    if (t.output_type) setOption('outputType', t.output_type);
    if (t.tone) setOption('tone', t.tone);
  }

  function buildSystemPrompt() {
    const { platform, tone, language, detail, outputType } = config;
    const langMap = { arabic: 'The prompt must be written in Arabic', english: 'Respond in English only', both: 'Bilingual: Arabic and English' };
    const detailMap = { brief: '150-250 words', moderate: '300-500 words', detailed: '600-900 words' };
    const toneMap = { professional: 'professional', creative: 'creative', educational: 'educational', friendly: 'friendly', formal: 'strictly formal', motivational: 'motivational', technical: 'technical and precise', storytelling: 'narrative' };
    const typeGuide = {
      casestudy: 'Structure the prompt for a detailed case study: background, problem, analysis, solution, results, lessons learned.',
      feasibility: 'Structure the prompt for a feasibility study: executive summary, market analysis, financial projections, risks, recommendations.',
      business: 'Structure the prompt for a business idea: concept, target market, value proposition, revenue model, first action steps.',
    };

    const basePrompt = systemConfig.base_system_prompt || '';
    let sys = basePrompt || `You are an expert prompt engineer for ${platformNames[platform] || platform}. Create professional optimized prompts.`;
    sys += `\nTone: ${toneMap[tone] || 'professional'}\nLanguage: ${langMap[language]}\nLength: ${detailMap[detail]}\nReturn ONLY the prompt text. No preamble, no markdown formatting.`;
    const extra = typeGuide[outputType];
    if (extra) sys += '\n' + extra;
    return sys;
  }

  // Simulate typing effect from full text
  const simulateTyping = useCallback((fullText) => {
    return new Promise((resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        if (controllerRef.current?.signal?.aborted || i >= fullText.length) {
          clearInterval(interval);
          resolve();
          return;
        }
        const chunk = fullText.slice(0, i + 3); // 3 chars at a time
        i += 3;
        setResult(chunk);
      }, 15);
    });
  }, []);

  async function generate() {
    if (!userInput.trim()) { toast.error('⚠️ اكتب وصفاً أولاً'); return; }

    setShowResult(true);
    setResult('');
    setError('');
    setIsStreaming(true);
    startTimeRef.current = Date.now();
    controllerRef.current = new AbortController();

    try {
      const fullText = await generateViaN8n({
        userInput,
        platform: config.platform,
        tone: config.tone,
        outputType: config.outputType,
        language: config.language,
        detail: config.detail,
        systemPrompt: buildSystemPrompt(),
      }, controllerRef.current.signal);

      // Simulate typing
      await simulateTyping(fullText);
      setResult(fullText);

      // Save to history
      const elapsed = Date.now() - startTimeRef.current;
      try {
        await supabase.from('prompt_history').insert({
          user_input: userInput,
          generated_prompt: fullText,
          platform: config.platform,
          tone: config.tone,
          tokens_used: Math.ceil(fullText.length / 4),
          generation_time_ms: elapsed,
        });
      } catch (e) { /* history save is optional */ }

      const words = fullText.split(/\s+/).filter(Boolean).length;
      setStats({
        words,
        chars: fullText.length,
        platform: platformNames[config.platform] || config.platform,
        time: (elapsed / 1000).toFixed(1),
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('❌ ' + err.message);
      }
    } finally {
      setIsStreaming(false);
      controllerRef.current = null;
    }
  }

  function stopGeneration() {
    controllerRef.current?.abort();
  }

  function copyResult() {
    navigator.clipboard.writeText(result).then(() => toast.success('✅ تم النسخ!'));
  }

  function clearAll() {
    setUserInput('');
    setShowResult(false);
    setResult('');
    setError('');
  }

  function downloadResult() {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 تم التحميل!');
  }

  function renderTags(items, configKey) {
    return (
      <div className="tags-row">
        {items.map(opt => (
          <span
            key={opt.key}
            className={`tag ${config[configKey] === opt.key ? 'active' : ''}`}
            onClick={() => setOption(configKey, opt.key)}
          >
            {opt.label}
          </span>
        ))}
      </div>
    );
  }

  const currentTips = tipsData[config.platform] || tipsData.claude;

  return (
    <>
      <div className="grid-bg" />
      <div className="ambient" />

      <div className="container" dir="rtl">
        {/* Header */}
        <div className="header">
          <img src="/logo.png" alt="Promptt.pro" style={{ width: '250px', display: 'block', margin: '0 auto 1.25rem' }} />
          <div className="badge">
            <span className="live-dot" />
            {systemConfig.badge_text || 'Promptt.pro — AI Prompt Generator'}
          </div>
          <h1>{systemConfig.site_title_line1 || 'مولّد'} <span className="text-gradient">{systemConfig.site_title_line2 || 'البرومبتات الاحترافي'}</span></h1>
          <p className="subtitle">{systemConfig.subtitle || 'ذكاء اصطناعي حقيقي يكتب برومبتك أمامك حرفاً بحرف'}</p>
        </div>

        {/* Templates */}
        <div className="card">
          <h3 className="section-title">⚡ Templates جاهزة</h3>
          {loading ? (
            <SkeletonCard count={2} />
          ) : (
            <div className="templates-grid">
              {templates.map(t => (
                <div key={t.id} className="template-card" onClick={() => applyTemplate(t)}>
                  <div className="template-icon">{t.icon}</div>
                  <div className="template-title">{t.title}</div>
                  <div className="template-desc">{t.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Config */}
        <div className="card">
          <h3 className="section-title">⚙️ تخصيص البرومبت</h3>

          {loading ? (
            <>
              <SkeletonTags count={5} />
              <SkeletonTags count={4} />
              <SkeletonTags count={3} />
            </>
          ) : (
            <>
              <label>🤖 المنصة:</label>
              {renderTags(options.platform, 'platform')}

              <label>📋 نوع المخرجات:</label>
              {renderTags(options.output_type, 'outputType')}

              <label>🎭 النبرة:</label>
              {renderTags(options.tone, 'tone')}

              <label>🌐 اللغة:</label>
              {renderTags(options.language, 'language')}

              <label>📏 مستوى التفاصيل:</label>
              {renderTags(options.detail, 'detail')}
            </>
          )}

          <div style={{ marginTop: '1.25rem' }}>
            <label>💭 وصف البرومبت المطلوب:</label>
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="مثال: اكتب لي مقال عن أثر الذكاء الاصطناعي على التعليم في السعودية..."
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) generate(); }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>💡 Ctrl+Enter للتوليد السريع</p>
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: '1.25rem' }}
            onClick={generate}
            disabled={isStreaming}
          >
            {isStreaming ? '⚡ جاري التوليد...' : '✨ توليد البرومبت بالذكاء الاصطناعي'}
          </button>
        </div>

        {/* Result */}
        <div className={`result-section ${showResult ? 'show' : ''}`}>
          <div className="card glow">
            <div className="stats-row">
              <div className="stat"><div className="stat-val">{stats.words}</div><div className="stat-lbl">كلمة</div></div>
              <div className="stat"><div className="stat-val">{stats.chars}</div><div className="stat-lbl">حرف</div></div>
              <div className="stat"><div className="stat-val">{stats.platform}</div><div className="stat-lbl">المنصة</div></div>
              <div className="stat"><div className="stat-val">{stats.time}</div><div className="stat-lbl">ثانية</div></div>
            </div>

            <div className="result-header">
              <h3 className="result-title">✨ البرومبت الجاهز</h3>
              <button className="btn btn-secondary btn-sm" onClick={copyResult}>📋 نسخ</button>
            </div>

            {error && <div className="error-box show">{error}</div>}

            {isStreaming && (
              <div className="stream-bar show">
                <span className="live-dot" />
                <div className="bar-wrap">
                  <div className="bar-fill" style={{ width: `${Math.min((result.length / 1200) * 100, 95)}%` }} />
                </div>
                <span className="bar-text">يكتب...</span>
                <span className="bar-chars">{result.length} حرف</span>
                <button className="btn-stop" onClick={stopGeneration}>⏹ إيقاف</button>
              </div>
            )}

            <div ref={resultBoxRef} className={`result-box ${isStreaming ? 'streaming' : ''}`}>
              {result}
              {isStreaming && <span className="cursor-blink" />}
            </div>

            <div className="actions-row">
              <button className="btn btn-secondary" onClick={generate}>🔄 إعادة التوليد</button>
              <button className="btn btn-secondary" onClick={downloadResult}>📥 تحميل</button>
              <button className="btn btn-secondary" onClick={clearAll}>🗑️ ابدأ من جديد</button>
            </div>

            <div className="tips-box">
              <h4 className="tips-title">💡 نصائح للاستخدام</h4>
              <ul className="tips-list">
                {currentTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <img src="/logo.png" alt="Promptt.pro" style={{ width: '120px', marginBottom: '1rem', opacity: 0.7 }} />
          <p>
            © 2026 {systemConfig.brand_name || 'Promptt.pro'} — صُنع بـ ❤️ لصناع المحتوى العرب |{' '}
            <a href="https://x.com/abdullah_ops1" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              @abdullah_ops1
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
