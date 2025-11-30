// lib/messaging/twilio.ts - Module serveur pour l'envoi de SMS via Twilio

import { createServiceClient } from '@/lib/supabase/server'
import type { RendezVousWithDetails } from '@/lib/types/database.types'

// Importer Twilio
const twilio = require('twilio')

// Configuration Twilio depuis les variables d'environnement
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

// Vérifier que les variables d'environnement sont définies
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.warn('⚠️  Variables Twilio non configurées. Les SMS ne pourront pas être envoyés.')
}

// Client Twilio
let twilioClient: any = null

// Initialiser le client Twilio seulement si les credentials sont disponibles
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du client Twilio:', error)
  }
}

/**
 * Fonction pour envoyer un SMS de rappel pour un rendez-vous
 * @param rendezVousId - ID du rendez-vous
 * @returns Promise<void>
 */
export async function sendReminderSms(rendezVousId: string): Promise<void> {
  const supabase = createServiceClient()

  try {
    // 1. Récupérer les informations du rendez-vous avec patient, dentiste et cabinet
    const { data: rendezVous, error: fetchError } = await supabase
      .from('rendez_vous')
      .select(`
        *,
        patient:patients(*),
        dentist:dentists(*),
        cabinet:cabinets(*)
      `)
      .eq('id', rendezVousId)
      .single()

    if (fetchError || !rendezVous) {
      throw new Error('Rendez-vous introuvable')
    }

    const rdv = rendezVous as unknown as RendezVousWithDetails

    // Vérifier que le patient existe
    if (!rdv.patient) {
      throw new Error('Patient introuvable pour ce rendez-vous')
    }

    // Vérifier que le patient a un numéro de téléphone
    if (!rdv.patient.phone) {
      throw new Error('Le patient n\'a pas de numéro de téléphone')
    }

    // 2. Construire le message SMS de rappel
    const startsAt = new Date(rdv.starts_at)
    const dateStr = startsAt.toLocaleDateString('fr-CH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    const timeStr = startsAt.toLocaleTimeString('fr-CH', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const dentistName = rdv.dentist
      ? `Dr. ${rdv.dentist.first_name} ${rdv.dentist.last_name}`
      : 'votre dentiste'

    const cabinetName = rdv.cabinet?.name || 'notre cabinet'

    const messageBody = `Bonjour ${rdv.patient.first_name},

Ceci est un rappel de votre rendez-vous chez ${cabinetName} :

📅 ${dateStr}
⏰ ${timeStr}
👨‍⚕️ ${dentistName}

Merci de nous prévenir en cas d'empêchement.

À bientôt !`

    // 3. Envoyer le SMS via Twilio
    let twilioSid: string | null = null
    let twilioStatus: string | null = null
    let errorMessage: string | null = null
    let smsStatus: 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered' = 'pending'

    if (twilioClient && TWILIO_PHONE_NUMBER) {
      try {
        const message = await twilioClient.messages.create({
          body: messageBody,
          from: TWILIO_PHONE_NUMBER,
          to: rdv.patient.phone,
        })

        twilioSid = message.sid
        twilioStatus = message.status
        smsStatus = 'sent'

        console.log('✅ SMS envoyé avec succès:', message.sid)
      } catch (twilioError: any) {
        console.error('❌ Erreur Twilio:', twilioError)
        errorMessage = twilioError.message || 'Erreur Twilio inconnue'
        smsStatus = 'failed'
        throw new Error(`Erreur Twilio: ${errorMessage}`)
      }
    } else {
      // Mode simulation (si Twilio n'est pas configuré)
      console.log('📱 MODE SIMULATION - SMS non envoyé (Twilio non configuré)')
      console.log('Message qui aurait été envoyé:')
      console.log('---')
      console.log(messageBody)
      console.log('---')
      console.log(`À: ${rdv.patient.phone}`)

      twilioSid = 'SIMULATED_' + Date.now()
      twilioStatus = 'simulated'
      smsStatus = 'sent'
      errorMessage = 'Mode simulation - Twilio non configuré'
    }

    // 4. Insérer une ligne dans la table messages
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        rendez_vous_id: rendezVousId,
        patient_id: rdv.patient.id,
        cabinet_id: rdv.cabinet_id,
        to_phone: rdv.patient.phone,
        message_body: messageBody,
        status: smsStatus,
        twilio_sid: twilioSid,
        twilio_status: twilioStatus,
        error_message: errorMessage,
        sent_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion du message dans la base:', insertError)
      throw new Error('Erreur lors de l\'enregistrement du message')
    }

    // 5. Mettre à jour le rendez-vous pour marquer le rappel comme envoyé
    const { error: updateError } = await supabase
      .from('rendez_vous')
      .update({
        reminder_sent: true,
        reminder_sent_at: new Date().toISOString(),
      })
      .eq('id', rendezVousId)

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du rendez-vous:', updateError)
      throw new Error('Erreur lors de la mise à jour du rendez-vous')
    }

    console.log('✅ Rappel SMS traité avec succès pour le rendez-vous:', rendezVousId)

  } catch (error: any) {
    console.error('❌ Erreur dans sendReminderSms:', error)

    // Enregistrer l'erreur dans la table messages
    try {
      await supabase.from('messages').insert({
        rendez_vous_id: rendezVousId,
        patient_id: rendezVous?.patient?.id || '00000000-0000-0000-0000-000000000000',
        cabinet_id: rendezVous?.cabinet_id || '00000000-0000-0000-0000-000000000000',
        to_phone: rendezVous?.patient?.phone || 'unknown',
        message_body: 'Erreur lors de la génération du message',
        status: 'failed',
        error_message: error.message,
      })
    } catch (logError) {
      console.error('❌ Impossible d\'enregistrer l\'erreur:', logError)
    }

    throw error
  }
}

/**
 * Fonction pour vérifier la configuration Twilio
 */
export function isTwilioConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && twilioClient)
}

/**
 * Fonction pour obtenir le statut de la configuration Twilio
 */
export function getTwilioStatus() {
  return {
    configured: isTwilioConfigured(),
    accountSid: TWILIO_ACCOUNT_SID ? '✓ Configuré' : '✗ Non configuré',
    authToken: TWILIO_AUTH_TOKEN ? '✓ Configuré' : '✗ Non configuré',
    phoneNumber: TWILIO_PHONE_NUMBER || '✗ Non configuré',
  }
}
