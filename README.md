# Aether — compagnon académique M1

Interface de chat pour le persona **Aether**, propulsée par l'API Groq.

## Fonctionnalités
- Chat en français ou en anglais, réponses courtes et structurées.
- Sélecteur de modèle : `openai/gpt-oss-120b` (défaut), `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `allam-2-7b`.
- Curseur « charge mentale » 1–10 : au-delà de 7, Aether allège le plan et propose une récupération.
- Prompt système visible dans l'interface (`system-prompt.md`).

## Sécurité
La clé Groq n'est **jamais** envoyée au navigateur. Elle est lue côté serveur dans la fonction Vercel `api/chat.js` via la variable d'environnement `GROQ_API_KEY`.

## Développement local
```bash
npm run dev
```
Puis ouvrir http://localhost:3000. Nécessite `GROQ_API_KEY` dans l'environnement.

## Déploiement
Déployé sur Vercel. Variable d'environnement à renseigner dans le projet Vercel :

```
GROQ_API_KEY = gsk_...
```

## Structure
```
index.html          Interface
styles.css          Style sombre
app.js              Logique client
api/chat.js         Fonction serverless (proxy Groq)
system-prompt.md    Prompt du persona
```
