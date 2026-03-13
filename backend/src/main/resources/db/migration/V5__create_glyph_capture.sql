CREATE TABLE glyph_capture (
   id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
   glyph_id     UUID         NOT NULL REFERENCES glyph(id) ON DELETE CASCADE,
   captured_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
   strokes      TEXT         NOT NULL,
   canvas_meta  TEXT         NOT NULL,
   notes        TEXT
);
