// app/api/patients/route.ts - API route pour les patients

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { PatientFormData } from '@/lib/types/database.types'

// GET /api/patients - Récupérer tous les patients avec leurs dentistes
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Récupérer tous les patients avec leurs dentistes (jointure)
    const { data: patients, error } = await supabase
      .from('patients')
      .select(`
        *,
        dentist:dentists(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des patients' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: patients,
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST /api/patients - Créer un nouveau patient
export async function POST(request: NextRequest) {
  try {
    const body: PatientFormData = await request.json()

    // Validation des champs obligatoires
    if (!body.first_name || !body.last_name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Les champs prénom, nom et téléphone sont obligatoires' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Récupérer le premier cabinet (pour le MVP, on suppose qu'il y a un seul cabinet)
    // Dans une version production, vous devriez récupérer le cabinet de l'utilisateur connecté
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

    // Créer le patient
    const { data: patient, error } = await supabase
      .from('patients')
      .insert({
        cabinet_id,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || null,
        phone: body.phone,
        date_of_birth: body.date_of_birth || null,
        address: body.address || null,
        city: body.city || null,
        postal_code: body.postal_code || null,
        notes: body.notes || null,
        dentist_id: body.dentist_id || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création du patient' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: patient,
      message: 'Patient créé avec succès',
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
