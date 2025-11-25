# API Backend Contact - Agence Automatisation IA

Backend Node.js/TypeScript sécurisé pour gérer les formulaires de contact avec analyse IA et notifications email.

## Fonctionnalités

- ✅ Validation des données de formulaire
- 🤖 Analyse IA automatique (résumé + priorité)
- 🔒 Chiffrement des données sensibles
- 💾 Stockage sécurisé dans Supabase
- 📧 Notification admin par email
- ✉️ Email de confirmation au prospect (français)
- 🛡️ Gestion complète des erreurs

## Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos vraies valeurs
```

## Configuration Supabase

1. Créer un projet sur [Supabase](https://supabase.com)
2. Exécuter le script SQL dans l'éditeur SQL Supabase:
```bash
cat supabase-schema.sql
```
3. Récupérer l'URL et la clé service role dans Settings > API

## Configuration Gmail

1. Activer l'authentification à 2 facteurs sur votre compte Gmail
2. Générer un mot de passe d'application:
   - Compte Google > Sécurité > Validation en deux étapes > Mots de passe d'application
3. Utiliser ce mot de passe dans `GMAIL_APP_PASSWORD`

## Configuration AI API

Pour OpenAI:
- Créer une clé API sur [platform.openai.com](https://platform.openai.com/api-keys)

Pour Claude (Anthropic):
- Remplacer l'URL par `https://api.anthropic.com/v1/messages`
- Adapter les headers et le format de requête

## Utilisation

### Développement
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoint

### POST /api/contact

**Request:**
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "company": "Example SA",
  "budget": "10000-20000 CHF",
  "deadline": "3 mois",
  "details": "Je cherche à automatiser la gestion de mes factures..."
}
```

**Response (succès):**
```json
{
  "success": true,
  "message": "Votre demande a été envoyée avec succès"
}
```

**Response (erreur):**
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

## Sécurité

- ✅ Toutes les clés API en variables d'environnement
- ✅ Chiffrement AES-256-CBC des données sensibles
- ✅ Validation stricte des entrées
- ✅ Pas de fuite d'informations dans les erreurs
- ✅ Service role Supabase (pas de clé publique)
- ✅ HTTPS recommandé en production

## Intégration n8n

Pour utiliser cette API dans n8n:

1. Déployer ce backend sur un serveur (Heroku, Railway, DigitalOcean, etc.)
2. Dans n8n, utiliser le node "HTTP Request"
3. Configurer:
   - Method: POST
   - URL: https://votre-domaine.com/api/contact
   - Body: JSON avec les champs du formulaire

## Structure du projet

```
├── contact-api.ts          # Code principal
├── package.json            # Dépendances
├── tsconfig.json           # Configuration TypeScript
├── .env.example            # Template variables d'environnement
├── supabase-schema.sql     # Schéma base de données
└── README.md               # Documentation
```

## Support

Pour toute question, contactez votre équipe technique.
