// app/api/dentists/route.ts - API route pour les dentistes

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/dentists - Récupérer tous les dentistes actifs
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Récupérer tous les dentistes actifs
    const { data: dentists, error } = await supabase
      .from('dentists')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des dentistes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: dentists,
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
