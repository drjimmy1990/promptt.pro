const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

/**
 * Send a prompt generation request to n8n webhook.
 * Returns the full generated prompt text.
 * The frontend handles the typing animation.
 */
export async function generateViaN8n({ userInput, platform, tone, outputType, language, detail, systemPrompt }, signal) {
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: userInput,
      platform,
      tone,
      output_type: outputType,
      language,
      detail,
      system_prompt: systemPrompt,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }

  const data = await res.json();
  // n8n should return { prompt: "..." }
  return data.prompt || data.output || data.text || '';
}
