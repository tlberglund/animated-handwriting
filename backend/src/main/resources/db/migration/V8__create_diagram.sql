CREATE TABLE diagram (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT        NOT NULL,
    aspect_ratio REAL        NOT NULL,
    strokes      TEXT        NOT NULL DEFAULT '[]',
    created_at   TIMESTAMP   NOT NULL,
    updated_at   TIMESTAMP   NOT NULL
);
