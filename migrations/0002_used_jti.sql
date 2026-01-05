-- Migration number: 0002 	 2025-12-28T17:37:30.969Z
CREATE TABLE IF NOT EXISTS used_jti (
	jti      TEXT PRIMARY KEY,
	exp      INTEGER NOT NULL,
	used_at  INTEGER NOT NULL,
	sub      TEXT
);
CREATE INDEX IF NOT EXISTS idx_used_jti_exp ON used_jti (exp);
