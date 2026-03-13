CREATE TABLE character_definition (
   id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
   character   VARCHAR(10)  NOT NULL UNIQUE,
   glyph_type  VARCHAR(20)  NOT NULL,
   sort_order  INT          NOT NULL
);
