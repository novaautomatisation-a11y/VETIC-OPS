// app/api/rendezvous/send-reminder/route.ts - API route pour envoyer un SMS de rappel

import { NextRequest, NextResponse } from 'next/server'
import { sendReminderSms, isTwilioConfigured } from '@/lib/messaging/twilio'
import { createServiceClient } from '@/lib/supabase/server'
import type { SendReminderRequest } from '@/lib/types/database.types'

// POST /api/rendezvous/send-reminder - Envoyer un SMS de rappel pour un rendez-vous
export async function POST(request: NextRequest) {
  try {
    const body: SendReminderRequest = await request.json()

    // Validation du rendezVousId
    if (!body.rendezVousId) {
      return NextResponse.json(
        { success: false, error: 'Le paramètre rendezVousId est obligatoire' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Vérifier que le rendez-vous existe et récupérer ses informations
    const { data: rendezVous, error: fetchError } = await supabase
      .from('rendez_vous')
      .select('*, patient:patients(*), cabinet:cabinets(*)')
      .eq('id', body.rendezVousId)
      .single()

    if (fetchError || !rendezVous) {
      return NextResponse.json(
        { success: false, error: 'Rendez-vous introuvable' },
        { status: 404 }
      )
    }

    // Vérification de sécurité: s'assurer que le rendez-vous appartient au cabinet
    // Pour le MVP, on suppose qu'il y a un seul cabinet, donc on skip cette vérification
    // Dans une version production avec authentification, vous devriez vérifier:
    // - Que l'utilisateur est authentifié
    // - Que le rendez-vous appartient au cabinet de l'utilisateur

    // Vérifier si un rappel a déjà été envoyé
    if (rendezVous.reminder_sent) {
      return NextResponse.json(
        { success: false, error: 'Un rappel a déjà été envoyé pour ce rendez-vous' },
        { status: 400 }
      )
    }

    // Vérifier que le rendez-vous n'est pas déjà passé
    const now = new Date()
    const startsAt = new Date(rendezVous.starts_at)

    if (startsAt < now) {
      return NextResponse.json(
        { success: false, error: 'Impossible d\'envoyer un rappel pour un rendez-vous passé' },
        { status: 400 }
      )
    }

    // Vérifier que le patient a un numéro de téléphone
    if (!rendezVous.patient?.phone) {
      return NextResponse.json(
        { success: false, error: 'Le patient n\'a pas de numéro de téléphone' },
        { status: 400 }
      )
    }

    // Envoyer le SMS de rappel
    try {
      await sendReminderSms(body.rendezVousId)

      return NextResponse.json({
        success: true,
        message: isTwilioConfigured()
          ? 'SMS de rappel envoyé avec succès'
          : 'Rappel traité en mode simulation (Twilio non configuré)',
      })
    } catch (smsError: any) {
      console.error('Erreur lors de l\'envoi du SMS:', smsError)
      return NextResponse.json(
        {
          success: false,
          error: smsError.message || 'Erreur lors de l\'envoi du SMS de rappel'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// GET /api/rendezvous/send-reminder - Vérifier le statut de la configuration Twilio
export async function GET(request: NextRequest) {
  const { getTwilioStatus } = require('@/lib/messaging/twilio')

  return NextResponse.json({
    success: true,
    data: getTwilioStatus(),
  })
}
