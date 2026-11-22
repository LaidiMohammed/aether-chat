const chat = document.getElementById('chat');
const form = document.getElementById('form');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const modelSel = document.getElementById('model');
const loadSel = document.getElementById('load');

const history = [];

function addMessage(role, text, isError = false) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
  const who = document.createElement('div');
  who.className = 'who';
  who.textContent = role === 'user' ? 'Toi' : 'Aether';
  const bubble = document.createElement('div');
  bubble.className = 'bubble' + (isError ? ' error' : '');
  bubble.textContent = text;
  wrap.append(who, bubble);
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;

  addMessage('user', text);
  history.push({ role: 'user', content: text });
  input.value = '';
  sendBtn.disabled = true;
  sendBtn.textContent = '…';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history,
        model: modelSel.value,
        load: loadSel.value ? Number(loadSel.value) : null
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || ('Erreur HTTP ' + res.status));

    addMessage('assistant', data.reply || '(réponse vide)');
    history.push({ role: 'assistant', content: data.reply || '' });
  } catch (err) {
    addMessage('assistant', 'Erreur : ' + err.message, true);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Envoyer';
    input.focus();
  }
});

fetch('system-prompt.md')
  .then(r => r.text())
  .then(t => { document.getElementById('promptText').textContent = t; })
  .catch(() => {});
