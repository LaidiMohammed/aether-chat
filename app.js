const $ = id => document.getElementById(id);
const chat = $('chat'), form = $('form'), input = $('input'), sendBtn = $('send');
const modelSel = $('model'), loadSel = $('load'), voiceLang = $('voiceLang');
const autoSend = $('autoSend'), autoSpeak = $('autoSpeak');
const voiceBar = $('voiceBar'), voiceText = $('voiceText');
const scrim = $('scrim'), modal = $('promptModal');
const history = [];

/* ---------- tiny markdown renderer ---------- */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
function markdown(text) {
  const lines = String(text).split(/\r?\n/);
  let out = '', i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      if (rows.length > 1 && /^[\s|:-]+$/.test(rows[1])) rows.splice(1, 1);
      out += '<div class="table-wrap"><table>' + rows.map((r, ri) =>
        '<tr>' + r.split('|').slice(1, -1).map(c =>
          ri === 0 ? '<th>' + inline(c.trim()) + '</th>' : '<td>' + inline(c.trim()) + '</td>'
        ).join('') + '</tr>'
      ).join('') + '</table></div>';
      continue;
    }
    let m;
    if ((m = l.match(/^###\s+(.+)/))) out += '<h3>' + inline(m[1]) + '</h3>';
    else if ((m = l.match(/^##\s+(.+)/))) out += '<h2>' + inline(m[1]) + '</h2>';
    else if ((m = l.match(/^#\s+(.+)/))) out += '<h1>' + inline(m[1]) + '</h1>';
    else if (/^\s*[-•*]\s+/.test(l)) { out += '<ul>'; while (i < lines.length && /^\s*[-•*]\s+/.test(lines[i])) { out += '<li>' + inline(lines[i].replace(/^\s*[-•*]\s+/, '')) + '</li>'; i++; } out += '</ul>'; continue; }
    else if (/^\s*\d+[.)]\s+/.test(l)) { out += '<ul>'; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { out += '<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; i++; } out += '</ul>'; continue; }
    else if (l.trim() === '') out += '<p></p>';
    else out += '<p>' + inline(l) + '</p>';
    i++;
  }
  return out;
}

function addMessage(role, text, isError = false) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
  if (role === 'assistant') {
    const av = document.createElement('div');
    av.className = 'avatar';
    av.innerHTML = '<img src="assets/aether-mark.svg" alt="">';
    wrap.appendChild(av);
  }
  const body = document.createElement('div');
  body.className = 'body';
  const who = document.createElement('div');
  who.className = 'who';
  who.textContent = role === 'user' ? 'Toi' : 'Aether';
  const bubble = document.createElement('div');
  bubble.className = 'bubble' + (isError ? ' error' : '');
  bubble.innerHTML = role === 'user' ? esc(text).replace(/\n/g, '<br>') : markdown(text);
  body.append(who, bubble);

  if (role === 'assistant' && !isError && 'speechSynthesis' in window) {
    const speakBtn = document.createElement('button');
    speakBtn.type = 'button';
    speakBtn.className = 'speak';
    speakBtn.textContent = '🔊 écouter';
    speakBtn.addEventListener('click', () => speak(text, null, speakBtn));
    body.appendChild(speakBtn);
  }
  wrap.appendChild(body);
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
  return wrap;
}

function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'msg assistant';
  wrap.id = 'typing';
  wrap.innerHTML = '<div class="avatar"><img src="assets/aether-mark.svg" alt=""></div><div class="body"><div class="who">Aether</div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div></div>';
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
}

/* ---------- send ---------- */
async function send(text) {
  const msg = (text || input.value).trim();
  if (!msg || sendBtn.disabled) return;

  addMessage('user', msg);
  history.push({ role: 'user', content: msg });
  input.value = '';
  autoGrow();
  sendBtn.disabled = true;
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history,
        model: modelSel.value,
        load: loadSel.value ? Number(loadSel.value) : null,
        language: voiceLang.value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || ('Erreur HTTP ' + res.status));
    const reply = data.reply || '(réponse vide)';
    $('typing')?.remove();
    addMessage('assistant', reply);
    history.push({ role: 'assistant', content: reply });
    if (autoSpeak.checked && reply !== lastSpoken) { lastSpoken = reply; speak(reply); }
  } catch (err) {
    $('typing')?.remove();
    addMessage('assistant', 'Erreur : ' + err.message, true);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener('submit', e => { e.preventDefault(); send(); });

function autoGrow() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 150) + 'px';
}
input.addEventListener('input', autoGrow);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});

document.querySelectorAll('[data-prompt]').forEach(b => {
  b.addEventListener('click', () => { input.value = b.dataset.prompt; autoGrow(); form.requestSubmit(); });
});

/* ---------- voice ---------- */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null, listening = false, finalText = '', switching = false;
const langChain = {
  'fr-FR': ['fr-FR', 'fr-FR'],
  'en-US': ['en-US', 'en-US'],
  'ar-DZ': ['ar-DZ', 'ar-SA', 'ar-EG', 'ar'],
  'ar-SA': ['ar-SA', 'ar-EG', 'ar']
};

function setListening(on) {
  listening = on;
  document.querySelectorAll('.mic-trigger').forEach(b => b.classList.toggle('on', on));
  document.querySelectorAll('.talk-btn').forEach(b => { b.textContent = on ? 'En cours d’écoute…' : 'Parler avec Aether'; });
}

function ensureRecognition() {
  if (!SpeechRecognition) return null;
  if (recognition) return recognition;
  recognition = new SpeechRecognition();
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => { listening = true; setListening(true); finalText = ''; voiceBar.hidden = false; voiceText.textContent = 'Je t’écoute…'; };

  recognition.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t + ' ';
      else interim += t;
    }
    input.value = (finalText + interim).trim();
    autoGrow();
    voiceText.textContent = input.value || 'Je t’écoute…';
  };

  recognition.onerror = e => {
    setListening(false);
    if (e.error === 'language-not-supported') {
      const chain = langChain[voiceLang.value] || [voiceLang.value];
      const idx = chain.indexOf(recognition.lang);
      if (idx >= 0 && idx + 1 < chain.length) {
        const next = chain[idx + 1];
        switching = true;
        recognition.lang = next;
        if ([...voiceLang.options].some(o => o.value === next)) voiceLang.value = next;
        voiceText.textContent = 'Locale non supportée · essai ' + next;
        voiceBar.hidden = false;
        try { recognition.start(); } catch (_) { switching = false; voiceText.textContent = 'Relance impossible, réessaie'; }
        return;
      }
      voiceText.textContent = 'Aucune locale disponible pour cette langue.';
    } else if (e.error === 'not-allowed') voiceText.textContent = 'Micro refusé · autorise-le dans le navigateur';
    else if (e.error === 'no-speech') voiceText.textContent = 'Je n’ai rien entendu, réessaie';
    else voiceText.textContent = 'Erreur micro : ' + e.error;
    voiceBar.hidden = false;
    setTimeout(() => { voiceBar.hidden = true; }, 3800);
  };

  recognition.onend = () => {
    if (switching) { switching = false; return; }
    setListening(false);
    const txt = input.value.trim() || finalText.trim();
    if (txt && autoSend.checked) { voiceBar.hidden = true; form.requestSubmit(); }
    else if (txt) { voiceText.textContent = 'Dictée prête · appuie sur Envoyer'; setTimeout(() => { voiceBar.hidden = true; }, 2600); }
    else voiceBar.hidden = true;
  };
  return recognition;
}

function toggleMic() {
  if (!SpeechRecognition) {
    addMessage('assistant', 'La dictée vocale n’est pas supportée par ce navigateur. Ouvre la page avec Chrome ou Edge.', true);
    return;
  }
  if (listening) { recognition.stop(); return; }
  finalText = '';
  const r = ensureRecognition();
  r.lang = voiceLang.value;
  voiceBar.hidden = false;
  voiceText.textContent = 'Je t’écoute…';
  try { r.start(); } catch (_) { voiceText.textContent = 'Micro déjà actif'; }
}
document.querySelectorAll('.mic-trigger').forEach(b => b.addEventListener('click', toggleMic));
$('stopVoice').addEventListener('click', () => { if (recognition) recognition.stop(); else setListening(false); });
voiceLang.addEventListener('change', () => { if (recognition) recognition.lang = voiceLang.value; });

/* ---------- speech synthesis ---------- */
let voices = [], speaking = false, lastSpoken = '';
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices();
  const langs = [...new Set(voices.map(v => v.lang.split('-')[0].toLowerCase()))];
  const names = [];
  if (langs.includes('fr')) names.push('FR');
  if (langs.includes('en')) names.push('EN');
  if (langs.includes('ar')) names.push('AR');
  const hint = $('voiceHint');
  if (hint) hint.textContent = names.length
    ? 'Voix de lecture détectées : ' + names.join(' · ') + '. Chrome / Edge recommandés.'
    : 'Aucune voix détectée · Chrome / Edge recommandés.';
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
  speechSynthesis.onend = () => setSpeaking(false);
  speechSynthesis.oncancel = () => setSpeaking(false);
}

function setSpeaking(on) {
  speaking = on;
  const b = $('stopSpeech');
  if (b) b.hidden = !on;
  document.querySelectorAll('.speak').forEach(x => {
    x.textContent = (on && x.dataset.active === '1') ? '⏹ arrêter' : '🔊 écouter';
  });
}
function stopSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  setSpeaking(false);
  lastSpoken = '';
}
$('stopSpeech').addEventListener('click', stopSpeech);

function cleanForSpeech(s) {
  return String(s)
    .replace(/\|/g, ' ')
    .replace(/\*\*|`/g, '')
    .replace(/^#{1,3}\s*/gm, '')
    .replace(/^\s*[-•*]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function speak(text, lang, btn) {
  if (!('speechSynthesis' in window)) return;
  if (btn && speaking && btn.dataset.active === '1') { stopSpeech(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
  u.lang = lang || voiceLang.value;
  u.rate = 1.02;
  const short = u.lang.split('-')[0].toLowerCase();
  const v = voices.find(v => v.lang.toLowerCase().startsWith(short));
  if (v) u.voice = v;
  document.querySelectorAll('.speak').forEach(x => { x.dataset.active = '0'; x.textContent = '🔊 écouter'; });
  if (btn) { btn.dataset.active = '1'; btn.textContent = '⏹ arrêter'; }
  setSpeaking(true);
  speechSynthesis.speak(u);
}

/* ---------- prompt modal + mobile menu ---------- */
function closeOverlays() {
  modal.classList.remove('show');
  $('sidebar').classList.remove('open');
  scrim.classList.remove('show');
}
function openModal() {
  closeOverlays();
  modal.classList.add('show');
  scrim.classList.add('show');
}
$('promptBtn').addEventListener('click', openModal);
$('promptBtnTop').addEventListener('click', openModal);
$('closePrompt').addEventListener('click', closeOverlays);
scrim.addEventListener('click', closeOverlays);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlays(); });
$('menuBtn').addEventListener('click', () => {
  const open = $('sidebar').classList.toggle('open');
  scrim.classList.toggle('show', open);
});

fetch('system-prompt.md').then(r => r.text()).then(t => { $('promptText').textContent = t; }).catch(() => {});
