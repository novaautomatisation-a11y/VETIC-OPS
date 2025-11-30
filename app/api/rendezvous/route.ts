// app/api/rendezvous/route.ts - API route pour les rendez-vous

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { RendezVousFormData } from '@/lib/types/database.types'

// GET /api/rendezvous - Récupérer tous les rendez-vous à venir avec leurs détails
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Récupérer tous les rendez-vous avec patient, dentiste et cabinet (jointure)
    const { data: rendezVous, error } = await supabase
      .from('rendez_vous')
      .select(`
        *,
        patient:patients(*),
        dentist:dentists(*),
        cabinet:cabinets(*)
      `)
      .order('starts_at', { ascending: true })

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des rendez-vous' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rendezVous,
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST /api/rendezvous - Créer un nouveau rendez-vous
export async function POST(request: NextRequest) {
  try {
    const body: RendezVousFormData = await request.json()

    // Validation des champs obligatoires
    if (!body.patient_id || !body.dentist_id || !body.starts_at || !body.ends_at) {
      return NextResponse.json(
        { success: false, error: 'Les champs patient, dentiste, date de début et date de fin sont obligatoires' },
        { status: 400 }
      )
    }

    // Validation des dates
    const startsAt = new Date(body.starts_at)
    const endsAt = new Date(body.ends_at)

    if (endsAt <= startsAt) {
      return NextResponse.json(
        { success: false, error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Récupérer le premier cabinet (pour le MVP, on suppose qu'il y a un seul cabinet)
    const { data: cabinets } = await supabase
      .from('cabinets')
      .select('id')
      .limit(1)

    if (!cabinets || cabinets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun cabinet trouvé. Veuillez d\'abord créer un cabinet.' },
        { status: 400 }
      )
    }

    const cabinet_id = cabinets[0].id

    // Créer le rendez-vous
    const { data: rendezVous, error } = await supabase
      .from('rendez_vous')
      .insert({
        cabinet_id,
        patient_id: body.patient_id,
        dentist_id: body.dentist_id,
        starts_at: body.starts_at,
        ends_at: body.ends_at,
        status: body.status || 'scheduled',
        reason: body.reason || null,
        notes: body.notes || null,
        reminder_sent: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création du rendez-vous' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rendezVous,
      message: 'Rendez-vous créé avec succès',
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
