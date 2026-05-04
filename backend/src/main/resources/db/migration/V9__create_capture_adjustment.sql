CREATE TABLE capture_adjustment (
   glyph_capture_id UUID            NOT NULL REFERENCES glyph_capture(id) ON DELETE CASCADE,
   scale            DOUBLE PRECISION NOT NULL DEFAULT 1.0,
   y_offset         DOUBLE PRECISION NOT NULL DEFAULT 0.0,

   PRIMARY KEY (glyph_capture_id)
);
