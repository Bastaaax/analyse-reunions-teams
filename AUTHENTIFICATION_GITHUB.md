# S'authentifier sur GitHub pour push (HTTPS)

GitHub n’accepte plus ton mot de passe pour `git push`. Il faut utiliser un **Personal Access Token**.

---

## 1. Créer un token sur GitHub

1. Va sur **https://github.com** et connecte-toi.
2. Clique sur ta **photo de profil** (en haut à droite) → **Settings**.
3. En bas à gauche : **Developer settings**.
4. **Personal access tokens** → **Tokens (classic)**.
5. **Generate new token** → **Generate new token (classic)**.
6. Donne un nom au token (ex. : `analyse-reunions-teams`).
7. Choisis une durée (ex. : 90 days ou No expiration).
8. Coche au minimum la case **repo** (accès aux dépôts).
9. Clique sur **Generate token**.
10. **Copie le token tout de suite** (il ne sera plus affiché ensuite).  
    Il ressemble à : `ghp_xxxxxxxxxxxxxxxxxxxx`

---

## 2. Utiliser le token pour push

Dans ton terminal :

```bash
cd /Users/boisjot/analyse-reunions-teams
git push -u origin main
```

Quand Git demande :
- **Username** : `Bastaaax` (ton identifiant GitHub)
- **Password** : **colle le token** (pas ton mot de passe GitHub)

Le token est enregistré par le gestionnaire de mots de passe de ton Mac, tu n’auras pas à le ressaisir à chaque push.

---

## 3. Alternative : enregistrer le token dans l’URL (moins sécurisé)

Pour ne pas avoir à le taper à chaque fois (une seule fois) :

```bash
git remote set-url origin https://Bastaaax:TON_TOKEN@github.com/Bastaaax/analyse-reunions-teams.git
git push -u origin main
```

Remplace `TON_TOKEN` par le token généré.  
**Attention** : le token apparaît en clair dans la config Git. Préférable d’utiliser l’étape 2 (saisie au premier push).

---

## 4. Alternative : SSH (sans token)

Si tu préfères utiliser une clé SSH :

1. Génère une clé SSH (si tu n’en as pas) :  
   `ssh-keygen -t ed25519 -C "ton@email.com"`  
   (Entrée pour accepter le fichier par défaut, mot de passe optionnel.)

2. Affiche la clé publique :  
   `cat ~/.ssh/id_ed25519.pub`  
   Copie tout le contenu.

3. Sur GitHub : **Settings** → **SSH and GPG keys** → **New SSH key** → colle la clé et enregistre.

4. Change l’URL du remote en SSH puis pousse :  
   ```bash
   git remote set-url origin git@github.com:Bastaaax/analyse-reunions-teams.git
   git push -u origin main
   ```
