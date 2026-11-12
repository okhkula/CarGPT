// CarGPT chat endpoint. Runs as a Vercel serverless function.
// Keeps the AI key on the server and streams the reply back as plain text.
//
// Default provider: Google Gemini (free tier, key from https://aistudio.google.com/apikey).
// Set GEMINI_API_KEY to use it. OPENAI_API_KEY is supported as a paid alternative.
// Both are called through the OpenAI-compatible chat completions format.

function provider() {
  const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (gemini) {
    return {
      name: 'Google Gemini',
      keyName: 'GEMINI_API_KEY',
      key: gemini,
      baseUrl: process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
      models: [process.env.AI_MODEL, 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'],
      tokenCap: false,
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      name: 'OpenAI',
      keyName: 'OPENAI_API_KEY',
      key: process.env.OPENAI_API_KEY,
      baseUrl: process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      models: [process.env.AI_MODEL || process.env.OPENAI_MODEL, 'gpt-5.4-mini', 'gpt-4o-mini'],
      tokenCap: true,
    };
  }
  return null;
}
const MAX_MESSAGES = 20;
const MAX_CHARS = 4000;
const MAX_IMAGE_CHARS = 4_000_000;

// Best-effort rate limit (per server instance) so a public URL can't drain the key quickly.
const hits = new Map();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_HITS = 30;

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_HITS;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 5_000_000) throw new Error('too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const clean = (v, max = 80) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').slice(0, max).trim();

function systemPrompt({ mode, vehicle, units, name }) {
  const lines = [
    'You are CarGPT, a personal car assistant and beginner-friendly virtual driving instructor.',
    'Your users are beginner drivers, first-time car owners, everyday drivers and car enthusiasts.',
    '',
    'How to answer:',
    '- Use simple, friendly language. Avoid jargon; when you must use a technical word, explain it in a few words.',
    '- Answer the question that was actually asked. Leave out unrelated information and do not repeat explanations already given in this conversation.',
    '- Be practical: what the problem might be, likely causes, what the driver can safely check, the next step, and when a mechanic is needed.',
    '- Safety first. Never encourage unsafe driving or risky repairs. For potentially dangerous problems (brakes, steering, overheating, oil pressure, airbags, fuel leaks, smoke) say so clearly, and tell the driver to pull over somewhere safe or get a professional inspection when appropriate.',
    '- You cannot inspect the car. Never present a diagnosis as confirmed: use wording such as "this is most likely" or "it could be", and say what would confirm it.',
    '- Maintenance intervals differ between vehicles. Prefer the manufacturer\'s recommended schedule for the specific car, and if you are not sure of the exact figure, give the typical range and tell the user to confirm it in the owner\'s manual.',
    '',
    'Scope:',
    '- In scope: cars, brands, models, specifications, components, terminology, maintenance, troubleshooting, dashboard warning lights, driving tips, road safety, parking, fuel efficiency, buying and owning a car, and navigation or directions questions (these are driving-related).',
    '- For navigation questions you have no live map or location: give helpful general route-planning guidance, ask for the start point if needed, and suggest checking a maps app for live traffic.',
    '- If a question is clearly unrelated to cars or driving, do not answer it. Reply in one or two friendly sentences that you are CarGPT and focus on cars and driving, and mention a few things you can help with (maintenance, car problems, driving tips, warning lights).',
    '',
    'Photos:',
    '- When the user sends a photo, first describe what you can see, then explain what the part or warning light is and what it may mean, then suggest next steps.',
    '- A photo is never enough for a confirmed mechanical diagnosis. State your uncertainty, and say when a professional inspection is needed.',
    '',
  ];
  if (mode === 'detailed') {
    lines.push(
      'Response style: DETAILED. Give a fuller answer. Where relevant, use short headed sections: Explanation, Possible causes, What to check, Recommended actions, Safety, When to visit a mechanic. Skip sections that do not apply. Use short bullet lists and numbered steps.'
    );
  } else {
    lines.push(
      'Response style: BRIEF. Give a short, direct answer of roughly 2 to 5 sentences (or up to 4 short bullets) with only the most important information. Always keep any critical safety warning.'
    );
  }
  lines.push(`Use ${units === 'mi' ? 'miles' : 'kilometres'} for distances. Format with simple Markdown.`);
  if (name) lines.push(`The user's name is ${clean(name, 40)}. Use it sparingly.`);
  if (vehicle && (vehicle.make || vehicle.model)) {
    const v = [clean(vehicle.year, 4), clean(vehicle.make, 40), clean(vehicle.model, 60), clean(vehicle.trim, 40)].filter(Boolean).join(' ');
    const extra = [];
    if (vehicle.fuel) extra.push(`fuel type: ${clean(vehicle.fuel, 20)}`);
    if (vehicle.mileage) extra.push(`current mileage: ${clean(vehicle.mileage, 9)} ${units === 'mi' ? 'mi' : 'km'}`);
    lines.push(
      '',
      `The user's selected vehicle is a ${v}${extra.length ? ' (' + extra.join(', ') + ')' : ''}.`,
      'Tailor answers to this vehicle whenever it is relevant (for example service intervals, fluids, tyre pressures, known quirks), and do not mention it when it is not relevant.'
    );
  } else {
    lines.push('', 'The user has not selected a vehicle. If the answer depends on the car, say so and ask for the make, model and year.');
  }
  return lines.join('\n');
}

function buildMessages(body) {
  const input = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  const out = [{ role: 'system', content: systemPrompt(body) }];
  input.forEach((m, i) => {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return;
    const text = String(m.content || '').slice(0, MAX_CHARS);
    const isLast = i === input.length - 1;
    const image = typeof m.image === 'string' ? m.image : '';
    if (m.role === 'user' && isLast && image) {
      if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > MAX_IMAGE_CHARS) {
        throw Object.assign(new Error('bad image'), { userMessage: 'That photo could not be read. Try a JPG or PNG under 3 MB.' });
      }
      out.push({
        role: 'user',
        content: [
          { type: 'text', text: text || 'What is in this photo, and is anything wrong?' },
          { type: 'image_url', image_url: { url: image } },
        ],
      });
    } else if (text) {
      out.push({ role: m.role, content: m.role === 'user' && m.hadImage ? `${text}\n[The user attached a photo with this message earlier.]` : text });
    }
  });
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Use POST.' });
  }
  const ai = provider();
  if (!ai) {
    return sendJson(res, 503, {
      error: 'CarGPT is not connected to an AI model yet. Add GEMINI_API_KEY in the Vercel project settings, then redeploy.',
    });
  }
  const key = ai.key;
  const BASE_URL = ai.baseUrl.replace(/\/$/, '');
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) {
    return sendJson(res, 429, { error: 'You are sending messages very quickly. Wait a few minutes and try again.' });
  }

  let messages;
  let mode;
  try {
    const body = await readBody(req);
    mode = body.mode === 'detailed' ? 'detailed' : 'brief';
    messages = buildMessages({ ...body, mode });
    if (messages.length < 2 || messages[messages.length - 1].role !== 'user') {
      return sendJson(res, 400, { error: 'Type a question first.' });
    }
  } catch (err) {
    return sendJson(res, 400, { error: err.userMessage || 'That message could not be read. Try again.' });
  }

  const models = [...new Set(ai.models.filter(Boolean))];
  let upstream;
  let lastStatus = 0;
  let lastDetail = '';
  for (const model of models) {
    try {
      upstream = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          ...(ai.tokenCap ? { max_completion_tokens: mode === 'detailed' ? 3000 : 1200 } : {}),
        }),
      });
    } catch (err) {
      return sendJson(res, 502, { error: 'CarGPT could not reach its AI model. Try again in a moment.' });
    }
    if (upstream.ok) break;
    lastStatus = upstream.status;
    lastDetail = await upstream.text().catch(() => '');
    // Try the next model when this one is unknown, or when its own rate limit is used up.
    const tryNext = lastStatus === 404 || lastStatus === 429 || lastStatus === 503 || (lastStatus === 400 && /model/i.test(lastDetail));
    upstream = null;
    if (!tryNext) break;
  }

  if (!upstream) {
    console.error(ai.name, 'error', lastStatus, lastDetail.slice(0, 500));
    if (lastStatus === 401 || lastStatus === 403 || (lastStatus === 400 && /api key/i.test(lastDetail))) {
      return sendJson(res, 502, { error: `${ai.name} rejected the API key. Check ${ai.keyName} in the Vercel project settings.` });
    }
    if (lastStatus === 429) {
      return sendJson(res, 502, { error: 'CarGPT has reached its free usage limit for now. Wait a minute and try again.' });
    }
    return sendJson(res, 502, { error: 'CarGPT could not answer that right now. Try again in a moment.' });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for await (const chunk of upstream.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content;
          if (delta) res.write(delta);
        } catch {
          /* ignore partial keep-alive lines */
        }
      }
    }
  } catch (err) {
    console.error('stream error', err);
  }
  res.end();
};
