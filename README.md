# Aether — compagnon académique M1 (version vocale)

## Versions
- **v1** : premier persona (compagnon académique calme). Sauvegardé par le tag Git `design-v1` et une copie dans `C:\Users\pc\Documents\aether-chat-v1-backup`.
- **v2** (actuelle) : persona « elite academic companion », réponses encore plus courtes et directement exploitables.
- Interface précédente (navy / glassmorphism) sauvegardée par le tag Git `design-navy`.

Pour revenir à la v1 : exécuter `restore-v1.bat` (restaure les fichiers, commite, pousse et redéploie). Pour revenir au navy : `git checkout design-navy -- index.html styles.css assets/aether-mark.svg`.

Interface de chat pour le persona **Aether**, propulsée par l'API Groq. Design éditorial papier/encre, logo SVG original, et conversation vocale **français · english · arabe (DZ)**.

## Fonctionnalités

### Design UI/UX
- Identité visuelle **éditoriale / papier** : fond papier `#F3EEE4`, encre `#1B1A17`, accent terracotta `#B4411F`, mode sombre inclus.
- Typographie : Newsreader (serif) pour la conversation, Inter (sans) pour l'interface, IBM Plex Mono pour les étiquettes, Noto Naskh Arabic pour l'arabe.
- Logo SVG minimaliste : « A » en traits d'encre, sans dégradé ni halo.
- Animations discrètes : fondu des messages, ondes vocales, survol souligné des idées rapides, ouverture modale. Pas de glass ni de glow.
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
- Bouton « 🔊 écouter » sur chaque réponse pour la rejouer, et bouton **« ⏹ Arrêter la voix »** pour couper la lecture en cours. Chaque réponse n'est lue qu'une seule fois.
- Repli automatique si `ar-DZ` n'est pas supporté : `ar-SA` → `ar-EG` → `ar`.
- Recommandé : **Chrome ou Edge** (meilleur support de la Web Speech API). Les voix disponibles dépendent du système et sont indiquées dans la sidebar.

### Fichiers générés
- Aether peut produire un **Excel (.xlsx)** ou un **PDF** quand tu demandes un plan d'études, un plan de compétences ou un livrable.
- Le modèle renvoie un bloc `<<<FILE>>>` avec les colonnes et les lignes ; l'interface affiche deux boutons : **Télécharger** et **Voir** (`👁 Voir le PDF` ouvre le PDF dans un nouvel onglet, `👁 Aperçu du tableau` affiche l'Excel dans une fenêtre). Génération côté navigateur (SheetJS + jsPDF).
- Repli automatique : si SheetJS est indisponible, le fichier est généré en **CSV** lisible par Excel.
- Raccourcis « Plan Excel » et « Skills plan PDF » dans la sidebar.

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
