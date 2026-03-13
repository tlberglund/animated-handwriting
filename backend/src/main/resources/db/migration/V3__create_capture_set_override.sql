CREATE TABLE capture_set_override (
   id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
   capture_set_id  UUID         NOT NULL REFERENCES capture_set(id) ON DELETE CASCADE,
   character       VARCHAR(10)  NOT NULL,
   override_type   VARCHAR(10)  NOT NULL,
   UNIQUE(capture_set_id, character)
);
