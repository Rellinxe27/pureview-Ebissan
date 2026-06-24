-- ============================================================
-- PureView Dashboard — initial schema
-- Apply via: Supabase SQL editor  OR  supabase db push
-- ============================================================

-- ── Helpers ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ── Services ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  base_price  NUMERIC(10,2) DEFAULT 0,
  color       TEXT DEFAULT '#4167e8',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_self ON services USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_services_user ON services(user_id);

-- ── Clients ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  city       TEXT,
  state      TEXT,
  zip        TEXT,
  notes      TEXT,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_self ON clients USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_name  ON clients(user_id, name);
CREATE TRIGGER tr_clients_updated BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Appointments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES clients(id)  ON DELETE SET NULL,
  service_id       UUID REFERENCES services(id) ON DELETE SET NULL,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status           TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled')),
  address          TEXT,
  notes            TEXT,
  price            NUMERIC(10,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointments_self ON appointments USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_appt_user     ON appointments(user_id);
CREATE INDEX idx_appt_schedule ON appointments(user_id, scheduled_at);
CREATE INDEX idx_appt_status   ON appointments(user_id, status);
CREATE TRIGGER tr_appt_updated BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Recurring services ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id         UUID REFERENCES clients(id)  ON DELETE SET NULL,
  service_id        UUID REFERENCES services(id) ON DELETE SET NULL,
  frequency         TEXT DEFAULT 'monthly'
                    CHECK (frequency IN ('weekly','biweekly','monthly','quarterly','yearly')),
  next_scheduled_at DATE,
  price             NUMERIC(10,2) DEFAULT 0,
  is_active         BOOLEAN DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE recurring_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY recurring_self ON recurring_services USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_recurring_user ON recurring_services(user_id);
CREATE TRIGGER tr_recurring_updated BEFORE UPDATE ON recurring_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Quotes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  title        TEXT NOT NULL,
  status       TEXT DEFAULT 'draft'
               CHECK (status IN ('draft','sent','accepted','declined','expired')),
  subtotal     NUMERIC(10,2) DEFAULT 0,
  tax_rate     NUMERIC(5,2)  DEFAULT 0,
  tax_amount   NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  valid_until  DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quotes_self ON quotes USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE TRIGGER tr_quotes_updated BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS quote_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    INTEGER DEFAULT 1,
  unit_price  NUMERIC(10,2) DEFAULT 0,
  total       NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY quote_items_self ON quote_items
  USING  (EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_id AND q.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_id AND q.user_id = auth.uid()));

-- ── Invoices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id      UUID REFERENCES clients(id)      ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status         TEXT DEFAULT 'draft'
                 CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  subtotal       NUMERIC(10,2) DEFAULT 0,
  tax_rate       NUMERIC(5,2)  DEFAULT 0,
  tax_amount     NUMERIC(10,2) DEFAULT 0,
  total_amount   NUMERIC(10,2) DEFAULT 0,
  due_date       DATE,
  paid_at        TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_self ON invoices USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_inv_user   ON invoices(user_id);
CREATE INDEX idx_inv_status ON invoices(user_id, status);
CREATE TRIGGER tr_inv_updated BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    INTEGER DEFAULT 1,
  unit_price  NUMERIC(10,2) DEFAULT 0,
  total       NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_items_self ON invoice_items
  USING  (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid()));

-- ── Payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id     UUID REFERENCES invoices(id) ON DELETE SET NULL,
  client_id      UUID REFERENCES clients(id)  ON DELETE SET NULL,
  amount         NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash'
                 CHECK (payment_method IN ('cash','card','bank_transfer','check','other')),
  reference      TEXT,
  paid_at        TIMESTAMPTZ DEFAULT now(),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_self ON payments USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_pay_user ON payments(user_id);

-- ── Expenses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT DEFAULT 'other'
              CHECK (category IN ('supplies','fuel','equipment','marketing','insurance','wages','other')),
  description TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  date        DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY expenses_self ON expenses USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_exp_user ON expenses(user_id);
CREATE INDEX idx_exp_date ON expenses(user_id, date);

-- ── Goals ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type         TEXT DEFAULT 'monthly' CHECK (period_type IN ('monthly','quarterly','yearly')),
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  revenue_target      NUMERIC(10,2) DEFAULT 0,
  new_clients_target  INTEGER DEFAULT 0,
  jobs_target         INTEGER DEFAULT 0,
  satisfaction_target NUMERIC(3,1) DEFAULT 5.0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goals_self ON goals USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE TRIGGER tr_goals_updated BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Tasks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  priority     TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_self ON tasks USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE TRIGGER tr_tasks_updated BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Feedback ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id      UUID REFERENCES clients(id)      ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  rating         INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  date           DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_self ON feedback USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_feedback_user ON feedback(user_id);

-- ── Team members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  role       TEXT DEFAULT 'technician',
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_self ON team_members USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_team_user ON team_members(user_id);
CREATE TRIGGER tr_team_updated BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Settings (one row per user) ───────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name       TEXT DEFAULT 'PureView Window Cleaning',
  owner_name          TEXT,
  email               TEXT,
  phone               TEXT,
  address             TEXT,
  city                TEXT,
  state               TEXT,
  zip                 TEXT,
  logo_url            TEXT,
  invoice_prefix      TEXT DEFAULT 'INV',
  next_invoice_number INTEGER DEFAULT 1001,
  quote_prefix        TEXT DEFAULT 'QUO',
  next_quote_number   INTEGER DEFAULT 1001,
  tax_rate            NUMERIC(5,2) DEFAULT 0,
  currency            TEXT DEFAULT 'USD',
  timezone            TEXT DEFAULT 'America/New_York',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_self ON settings USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER tr_settings_updated BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Auto-setup trigger for new users ─────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO settings (user_id) VALUES (NEW.id);
  INSERT INTO services (user_id, name, description, base_price, color) VALUES
    (NEW.id, 'Window Cleaning', 'Interior and exterior window cleaning', 150.00, '#4167e8'),
    (NEW.id, 'Screen Repair',   'Window screen repair and replacement',   75.00, '#8558e8');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
