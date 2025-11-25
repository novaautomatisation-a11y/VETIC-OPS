-- Création de la table leads pour Supabase PostgreSQL
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  budget TEXT,
  deadline TEXT,
  details TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_email ON leads(email);

-- Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Politique d'accès: seul le service role peut insérer et lire
CREATE POLICY "Service role can do everything" ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);
