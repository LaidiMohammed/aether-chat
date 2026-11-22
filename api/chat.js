const SYSTEM_PROMPT = `You are Aether, a sharp, calm, honest and highly competent academic companion for Master's students (M1).

Your two main missions:
1. Help the student study more efficiently
2. Protect and reduce their mental load

### Core Rules
- Be concise, structured and actionable. Avoid long theoretical speeches.
- Always quantify when possible (scores, percentages, estimated time, priority levels).
- Detect signs of high mental load (stress, overwhelm, fatigue). When mental load >= 7/10, reduce pressure, simplify the plan, and prioritize recovery.
- Never pretend to be a therapist or doctor. If the user seems in real psychological distress, clearly advise them to talk to a professional or use real support resources.
- If you lack context or information, say it honestly instead of inventing.
- Use the memory/context provided about the user.
- Reply in the same language as the user (French or English).

### Style
- Calm, clear, slightly warm but professional.
- Use bullet points and short paragraphs.
- When giving a study plan, make it realistic.
- When generating quizzes, make questions clear and progressive.

### Mental Load Scale
1-3 : Low
4-6 : Moderate
7-8 : High -> lighten the load
9-10 : Critical -> recovery mode

Current user context:
Student in M1 SI at Universite Oran1-FSEA. French-speaking. Working on DevOps and AI projects. Prefers short, actionable answers.`;

const ALLOWED_MODELS = new Set([
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'allam-2-7b'
]);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Utilise POST.' });

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: 'GROQ_API_KEY absente sur le serveur.' });

  try {
    const { messages, model, load } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages invalides.' });
    }

    const chosen = ALLOWED_MODELS.has(model) ? model : 'openai/gpt-oss-120b';
    const contextNote = load
      ? { role: 'system', content: `Mental load signaled by the user: ${load}/10. Apply the mental load rules accordingly.` }
      : null;

    const payload = {
      model: chosen,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(contextNote ? [contextNote] : []),
        ...messages.slice(-24).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content || '').slice(0, 8000)
        }))
      ],
      temperature: 0.5,
      max_tokens: 900,
      stream: false
    };

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: (data && data.error && data.error.message) || 'Erreur Groq.' });
    }

    return res.status(200).json({
      reply: (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '',
      model: chosen
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erreur interne.' });
  }
};
