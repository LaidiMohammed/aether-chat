# Aether — compagnon académique M1 (version vocale)

Interface de chat pour le persona **Aether**, propulsée par l'API Groq. Design aurora / glassmorphism, logo SVG original, et conversation vocale **français · english · arabe (DZ)**.

## Fonctionnalités

### Design UI/UX
- Identité visuelle originale : logo SVG « A » dans un hexagone, dégradé violet → cyan.
- Fond aurora animé + grille subtile, panneaux en verre dépoli (glassmorphism).
- Sidebar avec réglages, idées rapides, accès au prompt système.
- Micro-interactions : messages qui montent, indicateur de frappe, ondes sonores, états de focus.
- Rendu Markdown côté client : titres, listes, **gras**, `code` et **tableaux**.
- Responsive : sidebar coulissante sur mobile, zone de saisie auto-redimensionnée.
- Accessible : `aria-live`, labels, focus visible, respect de `prefers-reduced-motion`.

### Vocal
- Dictée via Web Speech API : **🇫🇷 Français (fr-FR)**, **🇬🇧 English (en-US)**, **🇩🇿 العربية DZ (ar-DZ)**, **🇸🇦 الفصحى (ar-SA)**.
- Bouton micro dans la sidebar et dans la zone de saisie.
- Option « Envoyer après la dictée » : le message part dès que tu arrêtes de parler.
- Option « Lire les réponses à voix haute » : Aether répond à l'oral.
- Bouton « 🔊 écouter » sur chaque réponse pour la rejouer.
- Recommandé : **Chrome ou Edge** (meilleur support de la Web Speech API). Les voix disponibles dépendent du système.

### Persona
- 4 modèles Groq sélectibles : `openai/gpt-oss-120b` (défaut), `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `allam-2-7b`.
- Curseur « charge mentale » 1–10 : au-delà de 7, Aether allège le plan et propose une récupération.
- Prompt système complet affichable dans l'interface (`system-prompt.md`).

## Sécurité
La clé Groq n'est **jamais** envoyée au navigateur. Elle est lue côté serveur dans `api/chat.js` via la variable d'environnement `GROQ_API_KEY` (chiffrée sur Vercel).

## Déploiement
Vercel : https://aether-chat-two.vercel.app

Variable d'environnement Production :

```
GROQ_API_KEY = gsk_...
```

## Développement local
```bash
npm run dev        # via Vercel CLI
```
Puis http://localhost:3000. Récupérer la clé localement avec `vercel env pull`.

## Structure
```
index.html              Interface + contrôles vocaux
styles.css              Aurora, glass, animations, responsive
app.js                  Chat, Markdown, dictée et synthèse vocale
api/chat.js             Fonction serverless (proxy Groq)
assets/aether-mark.svg  Logo
system-prompt.md        Prompt du persona
```
