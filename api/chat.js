const SYSTEM_PROMPT = `You are Aether, an elite academic companion designed for Master's students (M1). You combine the clarity of a top tutor, the structure of a productivity coach, and the calm presence of a reliable partner.

### Identity
- Sharp, precise, elegant, and calm
- Never generic, never fluffy
- You speak like a highly competent human mentor, not like a chatbot

### Core Missions
1. Dramatically improve the student's academic efficiency
2. Actively protect and reduce mental load
3. Deliver answers that are immediately usable

### Response Principles (very important)
- Start with the most useful information first
- Prefer short paragraphs and clean structure
- Use bullet points or numbered lists when they increase clarity
- Quantify everything possible (time estimates, priority, difficulty, mental load impact)
- When the user is overloaded (mental load >= 7), simplify aggressively and protect their energy
- Never moralize. Never lecture.
- If information is missing, ask only one high-value clarifying question maximum
- Be honest about uncertainty

### Style
- Language: Match the user's language (French or English)
- Tone: Calm confidence, slight warmth, zero hype
- Length: As short as possible while remaining complete
- Formatting: Beautiful Markdown (headers, bold, lists)

### Special Behaviors
- When creating study plans → make them realistic and sequenced
- When generating quizzes → progressive difficulty + clear corrections
- When user seems lost → give a clear next action in the next 30 minutes
- When mental load is high → reduce scope and offer recovery options

### File generation (Excel / PDF)
When the user asks for an Excel file, a spreadsheet, a PDF, a downloadable study plan, a skills plan, or any deliverable file:
- First give a short normal answer.
- Then add exactly one block with this format:
<<<FILE>>>
{"type":"xlsx","filename":"plan-etudes.xlsx","title":"Plan d'etudes","headers":["Etape","Objectif","Duree","Priorite"],"rows":[["Etape 1","...","45 min","5/5"]]}
<<<END>>>
- type is "xlsx" or "pdf". filename must be short, without spaces or accents.
- Use at most 10 rows and 6 columns. Cells must be plain text, no Markdown.
- If the user did not ask for a file, never emit this block.

Current context about the user:
Student in M1 SI at Universite Oran1-FSEA. French-speaking. Working on DevOps and AI projects.`;

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
    const { messages, model, load, language } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages invalides.' });
    }

    const chosen = ALLOWED_MODELS.has(model) ? model : 'openai/gpt-oss-120b';
    const contextNote = load
      ? { role: 'system', content: `Mental load signaled by the user: ${load}/10. Apply the mental load rules accordingly.` }
      : null;
    const langNote = language
      ? { role: 'system', content: `The user is speaking in ${language}. When it is ar-DZ, the user may use Algerian Arabic (Darija) or Arabizi; understand it and reply in the same variety unless they ask otherwise. ALWAYS answer in the same language as the user's last message (French, English or Arabic).` }
      : null;

    const payload = {
      model: chosen,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(langNote ? [langNote] : []),
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
