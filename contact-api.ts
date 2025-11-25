import express, { Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// Types
interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  deadline?: string;
  details: string;
}

interface LeadAnalysis {
  summary: string;
  priority: 'low' | 'medium' | 'high';
}

interface LeadRecord {
  name: string;
  email: string;
  company: string | null;
  budget: string | null;
  deadline: string | null;
  details: string;
  priority: string;
  summary: string;
}

// Environment variables validation
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'ADMIN_EMAIL',
  'ENCRYPTION_KEY',
  'AI_API_KEY'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
});

// Utility: Encrypt sensitive field
function encryptField(text: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'utf-8').subarray(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Utility: Validate request body
function validateRequestBody(body: any): { valid: boolean; error?: string } {
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return { valid: false, error: 'Le champ "name" est obligatoire' };
  }

  if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
    return { valid: false, error: 'Le champ "email" est obligatoire' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return { valid: false, error: 'Le format de l\'email est invalide' };
  }

  if (!body.details || typeof body.details !== 'string' || body.details.trim() === '') {
    return { valid: false, error: 'Le champ "details" est obligatoire' };
  }

  return { valid: true };
}

// Utility: Generate lead analysis with AI
async function generateLeadAnalysis(details: string): Promise<LeadAnalysis> {
  try {
    // Pseudo appel à une API IA (OpenAI, Claude, etc.)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui analyse les demandes de prospects. Génère un résumé concis (2-3 phrases) et détermine la priorité (low, medium, high) basée sur l\'urgence et la complexité.'
          },
          {
            role: 'user',
            content: `Analyse cette demande et retourne un JSON avec "summary" et "priority" (low/medium/high): ${details}`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('AI API call failed');
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    return {
      summary: aiResponse.summary || 'Résumé indisponible',
      priority: aiResponse.priority || 'medium'
    };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    // Fallback: analyse basique basée sur des mots-clés
    const detailsLower = details.toLowerCase();
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (detailsLower.includes('urgent') || detailsLower.includes('rapidement') || detailsLower.includes('asap')) {
      priority = 'high';
    } else if (detailsLower.includes('réflexion') || detailsLower.includes('éventuellement')) {
      priority = 'low';
    }

    return {
      summary: `Demande concernant l'automatisation IA. Détails: ${details.substring(0, 100)}...`,
      priority
    };
  }
}

// Utility: Save lead to Supabase
async function saveLeadToSupabase(
  leadData: ContactFormData,
  analysis: LeadAnalysis
): Promise<void> {
  const supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Optionnel: chiffrer les champs sensibles
  const encryptedEmail = encryptField(leadData.email);
  const encryptedDetails = encryptField(leadData.details);

  const record: LeadRecord = {
    name: leadData.name,
    email: encryptedEmail,
    company: leadData.company || null,
    budget: leadData.budget || null,
    deadline: leadData.deadline || null,
    details: encryptedDetails,
    priority: analysis.priority,
    summary: analysis.summary
  };

  const { error } = await supabase
    .from('leads')
    .insert([record]);

  if (error) {
    throw new Error(`Supabase insertion error: ${error.message}`);
  }
}

// Utility: Send admin email
async function sendAdminEmail(
  leadData: ContactFormData,
  analysis: LeadAnalysis
): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!
    }
  });

  const priorityLabel = {
    low: '🟢 Faible',
    medium: '🟡 Moyen',
    high: '🔴 Élevé'
  }[analysis.priority] || analysis.priority;

  const mailOptions = {
    from: process.env.GMAIL_USER!,
    to: process.env.ADMIN_EMAIL!,
    subject: `Nouveau lead: ${leadData.name} (Priorité: ${analysis.priority.toUpperCase()})`,
    html: `
      <h2>Nouveau contact reçu</h2>

      <h3>Informations du prospect:</h3>
      <ul>
        <li><strong>Nom:</strong> ${leadData.name}</li>
        <li><strong>Email:</strong> ${leadData.email}</li>
        <li><strong>Entreprise:</strong> ${leadData.company || 'Non spécifié'}</li>
        <li><strong>Budget:</strong> ${leadData.budget || 'Non spécifié'}</li>
        <li><strong>Délai:</strong> ${leadData.deadline || 'Non spécifié'}</li>
      </ul>

      <h3>Détails de la demande:</h3>
      <p>${leadData.details}</p>

      <hr>

      <h3>Analyse IA:</h3>
      <p><strong>Résumé:</strong> ${analysis.summary}</p>
      <p><strong>Niveau de priorité:</strong> ${priorityLabel}</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Utility: Send client confirmation email
async function sendClientConfirmationEmail(
  leadData: ContactFormData,
  analysis: LeadAnalysis
): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER!,
    to: leadData.email,
    subject: 'Confirmation de réception de votre demande',
    html: `
      <h2>Bonjour ${leadData.name},</h2>

      <p>Nous vous remercions pour votre demande concernant nos services d'automatisation IA.</p>

      <p>Nous avons bien reçu votre message et confirmons la bonne réception de votre demande.</p>

      <h3>Résumé de votre besoin:</h3>
      <p>${analysis.summary}</p>

      <p>Notre équipe analysera attentivement votre projet et vous répondra <strong>sous 24 à 48 heures</strong>.</p>

      <p>Nous vous rappelons que toutes vos données sont traitées de manière strictement confidentielle, conformément aux réglementations suisses en vigueur sur la protection des données.</p>

      <p>Si vous avez des questions urgentes, n'hésitez pas à nous recontacter.</p>

      <br>
      <p>Cordialement,<br>
      L'équipe de votre agence d'automatisation IA</p>

      <hr>
      <p style="font-size: 12px; color: #666;">
        Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
      </p>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Main route: POST /api/contact
app.post('/api/contact', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validation
    const validation = validateRequestBody(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error
      });
      return;
    }

    const formData: ContactFormData = {
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      company: req.body.company?.trim(),
      budget: req.body.budget?.trim(),
      deadline: req.body.deadline?.trim(),
      details: req.body.details.trim()
    };

    // 2. Generate AI analysis
    const analysis = await generateLeadAnalysis(formData.details);

    // 3. Save to Supabase
    await saveLeadToSupabase(formData, analysis);

    // 4. Send admin email
    await sendAdminEmail(formData, analysis);

    // 5. Send client confirmation email
    await sendClientConfirmationEmail(formData, analysis);

    // 6. Success response
    res.status(200).json({
      success: true,
      message: 'Votre demande a été envoyée avec succès'
    });

  } catch (error) {
    console.error('Error processing contact form:', error);

    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer.'
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
