# VETIC OPS - PHASE 2: Documentation de Test Local

## 📋 Vue d'ensemble

Cette documentation explique comment tester localement toutes les fonctionnalités de la PHASE 2 du MVP VETIC OPS :
- ✅ Gestion des patients
- ✅ Gestion des rendez-vous
- ✅ Envoi de SMS de rappel via Twilio

---

## 🚀 Installation et Configuration

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```bash
cp .env.local.example .env.local
```

Remplir le fichier `.env.local` avec vos vraies valeurs :

```bash
# Supabase Configuration (PUBLIC)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique_anon

# Supabase Configuration (PRIVATE)
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_SECRET

# Twilio Configuration (PRIVATE)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=votre_auth_token_secret
TWILIO_PHONE_NUMBER=+41xxxxxxxxx

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurer Supabase

#### 3.1 Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Copier l'URL et les clés API

#### 3.2 Exécuter le schema SQL

1. Dans le dashboard Supabase, aller dans **SQL Editor**
2. Ouvrir le fichier `supabase-schema-phase2.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL et exécuter

Cela va créer :
- ✅ 5 tables : `cabinets`, `dentists`, `patients`, `rendez_vous`, `messages`
- ✅ Tous les index pour les performances
- ✅ Row Level Security (RLS) activé
- ✅ Triggers pour `updated_at`
- ✅ Données de test (1 cabinet, 1 dentiste, 1 patient)

### 4. Configurer Twilio (optionnel)

Si vous voulez tester l'envoi de vrais SMS :

1. Créer un compte sur [twilio.com](https://www.twilio.com/try-twilio)
2. Obtenir un numéro de téléphone Twilio
3. Copier le `Account SID` et `Auth Token`
4. Remplir les variables `TWILIO_*` dans `.env.local`

**Note:** Si vous ne configurez pas Twilio, le système fonctionnera en **mode simulation**. Les SMS ne seront pas réellement envoyés, mais le message sera affiché dans les logs console.

---

## 🧪 Tests Locaux

### Étape 1: Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:3000`

---

### Étape 2: Vérifier le Dashboard

1. Ouvrir `http://localhost:3000` dans votre navigateur
2. Vous devriez voir le dashboard avec 3 cards :
   - **Patients** (cliquable)
   - **Rendez-vous** (cliquable)
   - **Dentistes** (bientôt disponible)

---

### Étape 3: Tester la page Patients

#### 3.1 Accéder à la page

1. Cliquer sur la card **Patients** ou aller sur `http://localhost:3000/patients`

#### 3.2 Vérifier le patient de test

Vous devriez voir le patient de test créé par le schema SQL :
- Nom: Jean Martin
- Téléphone: +41 79 987 65 43
- Dentiste: Dr. Marie Dupont

#### 3.3 Ajouter un nouveau patient

1. Cliquer sur **"+ Ajouter un patient"**
2. Remplir le formulaire :
   ```
   Prénom: Sophie
   Nom: Dubois
   Email: sophie.dubois@email.ch
   Téléphone: +41 79 456 78 90
   Date de naissance: 15/06/1990
   Dentiste: Dr. Marie Dupont (sélectionner dans le dropdown)
   Ville: Genève
   Code postal: 1200
   ```
3. Cliquer sur **"Ajouter le patient"**
4. Vérifier que le patient apparaît dans la liste
5. Vérifier dans Supabase (Table Editor → patients) que la ligne a été créée

#### 3.4 Vérifier l'API

Ouvrir dans le navigateur ou avec curl :

```bash
# GET - Récupérer tous les patients
curl http://localhost:3000/api/patients

# Vous devriez voir un JSON avec tous les patients
```

---

### Étape 4: Tester la page Rendez-vous

#### 4.1 Accéder à la page

1. Retourner au dashboard (`/`)
2. Cliquer sur la card **Rendez-vous** ou aller sur `http://localhost:3000/rendezvous`

#### 4.2 Ajouter un rendez-vous

1. Cliquer sur **"+ Ajouter un rendez-vous"**
2. Remplir le formulaire :
   ```
   Patient: Sophie Dubois (+41 79 456 78 90)
   Dentiste: Dr. Marie Dupont (Orthodontie)
   Date et heure de début: [Choisir une date future, ex: demain à 14:00]
   Date et heure de fin: [Automatiquement rempli avec +1h]
   Statut: Planifié
   Raison: Contrôle annuel
   Notes: Premier rendez-vous
   ```
3. Cliquer sur **"Créer le rendez-vous"**
4. Vérifier que le rendez-vous apparaît dans la liste
5. Vérifier dans Supabase (Table Editor → rendez_vous) que la ligne a été créée

#### 4.3 Vérifier l'API

```bash
# GET - Récupérer tous les rendez-vous
curl http://localhost:3000/api/rendezvous

# Vous devriez voir un JSON avec tous les rendez-vous
```

---

### Étape 5: Tester l'envoi de SMS de rappel

#### 5.1 Depuis l'interface web

1. Dans la page `/rendezvous`, trouver le rendez-vous créé
2. Dans la colonne **"Actions"**, cliquer sur **"📱 Envoyer SMS"**
3. Attendre quelques secondes
4. Un message devrait apparaître : "SMS de rappel envoyé avec succès !"

#### 5.2 Vérifier le résultat

**Si Twilio est configuré :**
- Le patient devrait recevoir un vrai SMS sur son téléphone
- Le SMS devrait ressembler à :
  ```
  Bonjour Sophie,

  Ceci est un rappel de votre rendez-vous chez Cabinet Dentaire Exemple :

  📅 jeudi 5 décembre 2024
  ⏰ 14:00
  👨‍⚕️ Dr. Marie Dupont

  Merci de nous prévenir en cas d'empêchement.

  À bientôt !
  ```

**Si Twilio n'est PAS configuré (mode simulation) :**
- Ouvrir la console du serveur (terminal où `npm run dev` tourne)
- Vous devriez voir :
  ```
  📱 MODE SIMULATION - SMS non envoyé (Twilio non configuré)
  Message qui aurait été envoyé:
  ---
  Bonjour Sophie,
  ...
  ---
  À: +41 79 456 78 90
  ```

#### 5.3 Vérifier la base de données

1. Aller dans Supabase → Table Editor → **messages**
2. Vous devriez voir une nouvelle ligne avec :
   - `to_phone`: +41 79 456 78 90
   - `status`: sent
   - `message_body`: Le message complet
   - `twilio_sid`: (si Twilio configuré) ou "SIMULATED_..." (si simulation)
   - `sent_at`: Date et heure d'envoi

3. Aller dans Supabase → Table Editor → **rendez_vous**
4. Trouver votre rendez-vous
5. Vérifier que :
   - `reminder_sent`: true
   - `reminder_sent_at`: Date et heure

#### 5.4 Tester l'API directement

```bash
# Récupérer l'ID d'un rendez-vous depuis Supabase
# Remplacer YOUR_RENDEZ_VOUS_ID par l'ID réel

curl -X POST http://localhost:3000/api/rendezvous/send-reminder \
  -H "Content-Type: application/json" \
  -d '{"rendezVousId": "YOUR_RENDEZ_VOUS_ID"}'

# Résultat attendu:
# {"success":true,"message":"SMS de rappel envoyé avec succès"}
```

#### 5.5 Vérifier le statut Twilio

```bash
# Vérifier si Twilio est configuré
curl http://localhost:3000/api/rendezvous/send-reminder

# Résultat si configuré:
# {
#   "success": true,
#   "data": {
#     "configured": true,
#     "accountSid": "✓ Configuré",
#     "authToken": "✓ Configuré",
#     "phoneNumber": "+41xxxxxxxxx"
#   }
# }

# Résultat si NON configuré (mode simulation):
# {
#   "success": true,
#   "data": {
#     "configured": false,
#     "accountSid": "✗ Non configuré",
#     "authToken": "✗ Non configuré",
#     "phoneNumber": "✗ Non configuré"
#   }
# }
```

---

## 📊 Résumé des Tests

| Test | Statut | Description |
|------|--------|-------------|
| ✅ Installation | À faire | `npm install` |
| ✅ Configuration | À faire | Créer `.env.local` avec Supabase + Twilio |
| ✅ Schema SQL | À faire | Exécuter `supabase-schema-phase2.sql` |
| ✅ Dashboard | À faire | Accéder à `http://localhost:3000` |
| ✅ Liste patients | À faire | Voir le patient de test |
| ✅ Ajouter patient | À faire | Créer un nouveau patient |
| ✅ API patients | À faire | `GET /api/patients` |
| ✅ Liste rendez-vous | À faire | Accéder à `/rendezvous` |
| ✅ Ajouter rendez-vous | À faire | Créer un nouveau rendez-vous |
| ✅ API rendez-vous | À faire | `GET /api/rendezvous` |
| ✅ Envoyer SMS (interface) | À faire | Cliquer sur "Envoyer SMS" |
| ✅ Envoyer SMS (API) | À faire | `POST /api/rendezvous/send-reminder` |
| ✅ Vérifier message BD | À faire | Table `messages` |
| ✅ Vérifier reminder_sent | À faire | Table `rendez_vous` |

---

## 🐛 Dépannage

### Erreur: "Aucun cabinet trouvé"

**Problème:** Le schema SQL n'a pas créé le cabinet de test.

**Solution:**
1. Aller dans Supabase → Table Editor → cabinets
2. Cliquer sur "Insert row"
3. Ajouter :
   ```
   name: Cabinet Dentaire Test
   address: Rue de la Santé 12
   phone: +41 22 123 45 67
   email: contact@cabinet-test.ch
   city: Genève
   postal_code: 1200
   country: Suisse
   ```

### Erreur: "Aucun dentiste dans le dropdown"

**Problème:** Le schema SQL n'a pas créé le dentiste de test.

**Solution:**
1. Aller dans Supabase → Table Editor → dentists
2. Cliquer sur "Insert row"
3. Ajouter :
   ```
   cabinet_id: [ID du cabinet créé ci-dessus]
   first_name: Marie
   last_name: Dupont
   email: marie.dupont@cabinet-test.ch
   phone: +41 79 123 45 67
   specialization: Orthodontie
   is_active: true
   ```

### Erreur: "Error fetching patients/rendez_vous"

**Problème:** Les variables Supabase ne sont pas correctement configurées.

**Solution:**
1. Vérifier `.env.local`
2. Vérifier que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont corrects
3. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est correct
4. Redémarrer le serveur (`Ctrl+C` puis `npm run dev`)

### SMS non reçu

**Problème:** Twilio n'est pas configuré ou numéro invalide.

**Solution:**
1. Vérifier que les 3 variables `TWILIO_*` sont dans `.env.local`
2. Vérifier que le numéro de téléphone du patient est au format international (+41...)
3. Si vous utilisez un compte Twilio Trial, vérifier que le numéro du patient est vérifié dans le dashboard Twilio
4. Consulter les logs du serveur pour voir le message d'erreur exact

---

## 📁 Structure des Fichiers Créés

```
VETIC-OPS/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Dashboard principal
│   ├── globals.css                   # Styles globaux Tailwind
│   ├── patients/
│   │   └── page.tsx                  # Page patients (liste + formulaire)
│   ├── rendezvous/
│   │   └── page.tsx                  # Page rendez-vous (liste + formulaire)
│   └── api/
│       ├── patients/
│       │   └── route.ts              # API GET/POST patients
│       ├── dentists/
│       │   └── route.ts              # API GET dentists
│       └── rendezvous/
│           ├── route.ts              # API GET/POST rendez-vous
│           └── send-reminder/
│               └── route.ts          # API POST envoyer SMS
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Client Supabase (côté client)
│   │   └── server.ts                 # Client Supabase (côté serveur)
│   ├── types/
│   │   └── database.types.ts         # Types TypeScript
│   └── messaging/
│       └── twilio.ts                 # Module Twilio (envoi SMS)
├── components/                       # (vide pour l'instant)
├── supabase-schema-phase2.sql        # Schema SQL complet
├── package.json                      # Dépendances (Next.js, React, Twilio)
├── next.config.js                    # Configuration Next.js
├── tsconfig.json                     # Configuration TypeScript
├── tailwind.config.ts                # Configuration Tailwind CSS
├── postcss.config.js                 # Configuration PostCSS
├── .env.local.example                # Template variables d'environnement
└── README-PHASE2.md                  # Cette documentation
```

---

## 🎯 Prochaines Étapes (PHASE 3)

Après avoir testé la PHASE 2, vous pourriez ajouter :

1. **Authentification** - Login/signup avec Supabase Auth
2. **Gestion multi-cabinets** - Support de plusieurs cabinets
3. **Tableau de bord avancé** - Statistiques et graphiques
4. **Notifications email** - En plus des SMS
5. **Historique des messages** - Voir tous les SMS envoyés
6. **Gestion des dentistes** - CRUD complet pour les dentistes
7. **Édition de patients/rendez-vous** - Modifier et supprimer
8. **Filtres et recherche** - Rechercher patients par nom, téléphone, etc.
9. **Calendrier visuel** - Voir les rendez-vous dans un calendrier
10. **Rappels automatiques** - Cron job pour envoyer des rappels X jours avant

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs du serveur (`npm run dev`)
2. Vérifier la console du navigateur (F12)
3. Vérifier les tables Supabase
4. Vérifier le fichier `.env.local`

Bon test ! 🚀
