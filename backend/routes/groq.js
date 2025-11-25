import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Fallback models in order of preference
const FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768"
];

async function callGroqWithFallback(url, key, prompt, modelIndex = 0) {
  if (modelIndex >= FALLBACK_MODELS.length) {
    throw new Error('All fallback models exhausted');
  }

  const model = FALLBACK_MODELS[modelIndex];
  const body = {
    model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 512,
    temperature: 0.2
  };

  const resp = await fetch(url + '/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key
    },
    body: JSON.stringify(body)
  });

  const data = await resp.json();
  console.log(`Groq response (${model}) status:`, resp.status);
  console.log(`Groq response (${model}) data:`, data);

  // If model is decommissioned, try next fallback
  if (resp.status === 400 && data.error?.code === 'model_decommissioned') {
    console.warn(`Model ${model} is decommissioned, trying next fallback...`);
    return callGroqWithFallback(url, key, prompt, modelIndex + 1);
  }

  if (!resp.ok) {
    throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
  }

  // Extract message content from Groq's OpenAI-compatible response
  const message = data.choices?.[0]?.message?.content || data;
  return { model, message };
}

// Proxy endpoint to call Groq API.
// Expects JSON: { prompt: "..." }
// Requires GROQ_API_KEY and GROQ_API_URL in env.
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Missing prompt' });
    const url = process.env.GROQ_API_URL;
    const key = process.env.GROQ_API_KEY;
    if (!url || !key) return res.status(500).json({ message: 'GROQ_API_URL or GROQ_API_KEY not set' });

    const { model, message } = await callGroqWithFallback(url, key, prompt);
    console.log(`Successfully generated response using model: ${model}`);
    res.json({ ok: true, data: message, model });
  } catch (err) {
    console.error('Groq proxy error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ message: 'Groq proxy error', error: err.message });
  }
});

export default router;
