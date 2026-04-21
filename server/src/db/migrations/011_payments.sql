CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inv_id          BIGINT UNIQUE NOT NULL,
  out_sum         NUMERIC(12, 2) NOT NULL,
  email           TEXT,
  status          TEXT NOT NULL DEFAULT 'success',
  product_code    TEXT NOT NULL DEFAULT 'english_lessons',
  email_sent_at   TIMESTAMPTZ,
  raw_params      JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
