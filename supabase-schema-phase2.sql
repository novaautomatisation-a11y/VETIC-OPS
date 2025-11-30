-- ============================================================================
-- VETIC OPS - PHASE 2: Schema SQL complet pour SaaS Dentaire/Médical
-- ============================================================================
-- Tables: cabinets, dentists, patients, rendez_vous, messages
-- Base de données: Supabase PostgreSQL
-- ============================================================================

-- ============================================================================
-- 1. TABLE: cabinets
-- Description: Les cabinets dentaires/médicaux (organisations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cabinets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'Suisse',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par nom et ville
CREATE INDEX idx_cabinets_name ON cabinets(name);
CREATE INDEX idx_cabinets_city ON cabinets(city);

-- ============================================================================
-- 2. TABLE: dentists
-- Description: Les dentistes/médecins travaillant dans les cabinets
-- ============================================================================
CREATE TABLE IF NOT EXISTS dentists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  specialization TEXT,
  license_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_dentists_cabinet_id ON dentists(cabinet_id);
CREATE INDEX idx_dentists_email ON dentists(email);
CREATE INDEX idx_dentists_last_name ON dentists(last_name);
CREATE INDEX idx_dentists_is_active ON dentists(is_active);

-- ============================================================================
-- 3. TABLE: patients
-- Description: Les patients des cabinets
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  dentist_id UUID REFERENCES dentists(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_patients_cabinet_id ON patients(cabinet_id);
CREATE INDEX idx_patients_dentist_id ON patients(dentist_id);
CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_is_active ON patients(is_active);

-- ============================================================================
-- 4. TABLE: rendez_vous
-- Description: Les rendez-vous entre patients et dentistes
-- ============================================================================
CREATE TABLE IF NOT EXISTS rendez_vous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche et filtrage rapide
CREATE INDEX idx_rendez_vous_cabinet_id ON rendez_vous(cabinet_id);
CREATE INDEX idx_rendez_vous_patient_id ON rendez_vous(patient_id);
CREATE INDEX idx_rendez_vous_dentist_id ON rendez_vous(dentist_id);
CREATE INDEX idx_rendez_vous_starts_at ON rendez_vous(starts_at DESC);
CREATE INDEX idx_rendez_vous_status ON rendez_vous(status);
CREATE INDEX idx_rendez_vous_reminder_sent ON rendez_vous(reminder_sent);

-- ============================================================================
-- 5. TABLE: messages
-- Description: Les messages SMS de rappel envoyés aux patients
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rendez_vous_id UUID NOT NULL REFERENCES rendez_vous(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE CASCADE,
  to_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')) DEFAULT 'pending',
  twilio_sid TEXT,
  twilio_status TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour suivi et reporting
CREATE INDEX idx_messages_rendez_vous_id ON messages(rendez_vous_id);
CREATE INDEX idx_messages_patient_id ON messages(patient_id);
CREATE INDEX idx_messages_cabinet_id ON messages(cabinet_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_twilio_sid ON messages(twilio_sid);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dentists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès: service role peut tout faire (pour l'instant)
-- Dans une version production, vous devriez ajouter des politiques basées sur l'utilisateur authentifié

CREATE POLICY "Service role can do everything on cabinets" ON cabinets
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on dentists" ON dentists
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on patients" ON patients
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on rendez_vous" ON rendez_vous
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on messages" ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FONCTION: Mise à jour automatique de updated_at
-- ============================================================================

-- Fonction trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour chaque table
CREATE TRIGGER update_cabinets_updated_at BEFORE UPDATE ON cabinets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dentists_updated_at BEFORE UPDATE ON dentists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rendez_vous_updated_at BEFORE UPDATE ON rendez_vous
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONNÉES DE TEST (optionnel - commenter si non souhaité)
-- ============================================================================

-- Insérer un cabinet de test
INSERT INTO cabinets (id, name, address, phone, email, city, postal_code) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Cabinet Dentaire Exemple', 'Rue de la Santé 12', '+41 22 123 45 67', 'contact@cabinet-exemple.ch', 'Genève', '1200')
ON CONFLICT (id) DO NOTHING;

-- Insérer un dentiste de test
INSERT INTO dentists (id, cabinet_id, first_name, last_name, email, phone, specialization) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Dr. Marie', 'Dupont', 'marie.dupont@cabinet-exemple.ch', '+41 79 123 45 67', 'Orthodontie')
ON CONFLICT (id) DO NOTHING;

-- Insérer un patient de test
INSERT INTO patients (id, cabinet_id, dentist_id, first_name, last_name, email, phone, date_of_birth, address, city, postal_code) VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Jean', 'Martin', 'jean.martin@email.ch', '+41 79 987 65 43', '1985-03-15', 'Avenue du Lac 45', 'Genève', '1200')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FIN DU SCHEMA
-- ============================================================================
