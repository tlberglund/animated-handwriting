ALTER TABLE glyph
   ADD COLUMN default_capture_id UUID REFERENCES glyph_capture(id) ON DELETE SET NULL;
