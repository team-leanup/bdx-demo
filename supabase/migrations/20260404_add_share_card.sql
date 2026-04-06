-- Add share_card_id column to consultation_records
ALTER TABLE consultation_records
  ADD COLUMN share_card_id TEXT UNIQUE;

-- Partial index: only index rows where share_card_id is set
CREATE INDEX idx_consultation_records_share_card
  ON consultation_records(share_card_id)
  WHERE share_card_id IS NOT NULL;
