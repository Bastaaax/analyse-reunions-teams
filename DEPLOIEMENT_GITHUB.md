# Importer le projet sur GitHub

Suis ces étapes **dans l’ordre** dans un terminal, en étant dans le dossier du projet.

---

## 1. Configurer ton identité Git (une seule fois sur ta machine)

Si tu ne l’as jamais fait, exécute :

```bash
git config --global user.email "ton-email@exemple.com"
git config --global user.name "Ton Nom ou Pseudo GitHub"
```

Remplace par ton vrai email et le nom affiché sur GitHub.

---

## 2. Faire le premier commit (si pas déjà fait)

```bash
cd /Users/boisjot/analyse-reunions-teams

git add .
git commit -m "Initial commit - Analyse réunions Teams"
```

---

## 3. Récupérer l’URL de ton repo GitHub

- Ouvre ton repo sur GitHub (celui que tu viens de créer).
- Clique sur le bouton vert **Code**.
- Copie l’URL :
  - **HTTPS** : `https://github.com/TON_USER/analyse-reunions-teams.git`
  - ou **SSH** : `git@github.com:TON_USER/analyse-reunions-teams.git`

Remplace `TON_USER` par ton identifiant GitHub.

---

## 4. Lier le projet au repo GitHub

Une seule de ces deux lignes, selon ce que tu as copié (HTTPS ou SSH) :

```bash
git remote add origin https://github.com/TON_USER/analyse-reunions-teams.git
```

ou

```bash
git remote add origin git@github.com:TON_USER/analyse-reunions-teams.git
```

Si tu vois *"remote origin already exists"*, remplace l’URL par :

```bash
git remote set-url origin https://github.com/TON_USER/analyse-reunions-teams.git
```

---

## 5. Pousser le code

### Cas A : Le repo GitHub est **vide** (sans README, sans fichier)

```bash
git branch -M main
git push -u origin main
```

### Cas B : Tu as créé le repo **avec** un README (ou une licence)

Git refuse souvent le push car les historiques diffèrent. Deux possibilités :

**Option 1 – Récupérer le README de GitHub puis pousser :**

```bash
git branch -M main
git pull origin main --allow-unrelated-histories
# Résoudre les conflits s’il y en a (garder tes fichiers), puis :
git add .
git commit -m "Merge avec repo GitHub"
git push -u origin main
```

**Option 2 – Écraser le repo GitHub avec ton projet (le README sur GitHub sera remplacé) :**

```bash
git branch -M main
git push -u origin main --force
```

---

## En cas d’erreur d’authentification

- **HTTPS** : GitHub demande un **Personal Access Token** (plus de mot de passe).  
  Création : GitHub → Settings → Developer settings → Personal access tokens → Generate new token.  
  Utilise ce token comme mot de passe quand Git te le demande.

- **SSH** : Il faut avoir une clé SSH et l’ajouter à ton compte GitHub (Settings → SSH and GPG keys).

---

## Récap rapide (repo vide)

```bash
cd /Users/boisjot/analyse-reunions-teams
git config --global user.email "ton@email.com"
git config --global user.name "Ton Nom"
git add .
git commit -m "Initial commit - Analyse réunions Teams"
git remote add origin https://github.com/TON_USER/analyse-reunions-teams.git
git branch -M main
git push -u origin main
```

(En remplaçant `ton@email.com`, `Ton Nom` et `TON_USER`.)
