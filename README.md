# Analyse de réunions Teams

Application web pour importer les transcriptions de réunions Microsoft Teams et générer des statistiques de participation : temps de parole, nombre d’interventions, typologie (questions, propositions, réactions, interruptions).

## Fonctionnalités MVP

- **Import** : glisser-déposer ou sélection de fichiers `.vtt`, `.srt`, `.txt` (max 10 Mo)
- **Participants** : révision des noms détectés, fusion de doublons, exclusion (ex. bot)
- **Statistiques** : par participant — interventions, temps total, % du temps ; global — durée, graphiques
- **Typologie** : catégorisation automatique (question, déclaration, proposition, réaction, interruption)
- **Export** : CSV et PDF

## Démarrage

```bash
cd analyse-reunions-teams
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Stack

- React 18, TypeScript, Vite
- TailwindCSS, composants type shadcn (Radix)
- Recharts (graphiques)
- jsPDF + jspdf-autotable (export PDF)
- Traitement 100 % côté client (aucun backend)

## Format de transcription attendu

**VTT / SRT** : blocs avec timestamps et lignes `Nom: texte`.

Exemple VTT :

```
WEBVTT

00:00:05.000 --> 00:00:08.000
Jean Dupont: Bonjour à tous, merci d'être là.

00:00:08.500 --> 00:00:12.000
Marie Martin: Bonjour Jean !
```

**TXT** : lignes au format `Nom: texte`, éventuellement avec timestamps.

---

## Déploiement

L’app est une SPA statique (Vite). Vous pouvez la déployer sur **Vercel** ou **Netlify** (gratuit).

### Option 1 : Vercel (recommandé)

1. **Pousser le projet sur GitHub** (si ce n’est pas déjà fait) :
   ```bash
   cd analyse-reunions-teams
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USER/VOTRE_REPO.git
   git push -u origin main
   ```

2. Aller sur [vercel.com](https://vercel.com), se connecter avec GitHub.

3. **Import Project** → choisir le dépôt `analyse-reunions-teams`.

4. Laisser les paramètres par défaut (Vercel détecte Vite) et cliquer sur **Deploy**.

5. L’URL de production sera du type : `https://analyse-reunions-teams-xxx.vercel.app`.

Le fichier `vercel.json` configure déjà le build et les redirections SPA.

### Option 2 : Netlify

1. Pousser le projet sur GitHub (voir ci‑dessus).

2. Aller sur [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** → GitHub → choisir le dépôt.

3. Paramètres :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`

4. **Deploy**.

Le fichier `netlify.toml` est déjà configuré.

### Option 3 : Build manuel puis hébergement

```bash
npm run build
```

Le dossier `dist/` contient les fichiers statiques. Vous pouvez les déployer sur n’importe quel hébergeur (OVH, o2switch, AWS S3 + CloudFront, Azure Static Web Apps, etc.) en uploadant le contenu de `dist/`.
# analyse-reunions-teams
