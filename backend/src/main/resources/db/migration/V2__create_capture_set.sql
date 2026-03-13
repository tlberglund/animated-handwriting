CREATE TABLE capture_set (
   id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
   name        VARCHAR(200)  NOT NULL,
   description TEXT,
   created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
