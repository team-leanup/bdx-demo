-- Migration: create pre_consultations table
-- Phase 1 of "미리 정하기 (Pre-Consult)" feature

CREATE TABLE pre_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL REFERENCES shops(id),
  booking_id TEXT REFERENCES booking_requests(id),
  customer_id TEXT REFERENCES customers(id),
  language TEXT NOT NULL DEFAULT 'ko',
  status TEXT NOT NULL DEFAULT 'in_progress',
  data JSONB NOT NULL DEFAULT '{}',
  design_category TEXT,
  confirmed_price INTEGER,
  estimated_minutes INTEGER,
  reference_image_paths JSONB DEFAULT '[]',
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_pre_consultations_shop_id ON pre_consultations(shop_id);
CREATE INDEX idx_pre_consultations_status ON pre_consultations(status);
CREATE INDEX idx_pre_consultations_created_at ON pre_consultations(created_at DESC);

-- Storage bucket for pre-consult reference images
-- NOTE: Run this separately via Supabase Dashboard > Storage, or via MCP once token is refreshed:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('pre-consult-refs', 'pre-consult-refs', false)
--   ON CONFLICT (id) DO NOTHING;
