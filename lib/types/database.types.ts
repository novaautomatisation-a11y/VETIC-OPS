// lib/types/database.types.ts - Types TypeScript générés depuis le schema SQL Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// TYPES DE TABLES
// ============================================================================

export interface Cabinet {
  id: string
  name: string
  address: string
  phone: string
  email: string
  city: string
  postal_code: string
  country: string
  created_at: string
  updated_at: string
}

export interface Dentist {
  id: string
  cabinet_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  specialization: string | null
  license_number: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  cabinet_id: string
  dentist_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string
  date_of_birth: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RendezVous {
  id: string
  cabinet_id: string
  patient_id: string
  dentist_id: string
  starts_at: string
  ends_at: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reason: string | null
  notes: string | null
  reminder_sent: boolean
  reminder_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  rendez_vous_id: string
  patient_id: string
  cabinet_id: string
  to_phone: string
  message_body: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered'
  twilio_sid: string | null
  twilio_status: string | null
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  created_at: string
}

// ============================================================================
// TYPES POUR SUPABASE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      cabinets: {
        Row: Cabinet
        Insert: Omit<Cabinet, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Cabinet, 'id' | 'created_at' | 'updated_at'>>
      }
      dentists: {
        Row: Dentist
        Insert: Omit<Dentist, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Dentist, 'id' | 'created_at' | 'updated_at'>>
      }
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
      }
      rendez_vous: {
        Row: RendezVous
        Insert: Omit<RendezVous, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<RendezVous, 'id' | 'created_at' | 'updated_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// TYPES ENRICHIS (avec relations)
// ============================================================================

export interface PatientWithDentist extends Patient {
  dentist?: Dentist
}

export interface RendezVousWithDetails extends RendezVous {
  patient?: Patient
  dentist?: Dentist
  cabinet?: Cabinet
}

export interface MessageWithDetails extends Message {
  rendez_vous?: RendezVous
  patient?: Patient
}

// ============================================================================
// TYPES POUR FORMULAIRES
// ============================================================================

export interface PatientFormData {
  first_name: string
  last_name: string
  email?: string
  phone: string
  date_of_birth?: string
  address?: string
  city?: string
  postal_code?: string
  notes?: string
  dentist_id?: string
}

export interface RendezVousFormData {
  patient_id: string
  dentist_id: string
  starts_at: string
  ends_at: string
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reason?: string
  notes?: string
}

// ============================================================================
// TYPES POUR API
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SendReminderRequest {
  rendezVousId: string
}

export interface SendReminderResponse {
  success: boolean
  message: string
  messageSid?: string
}
