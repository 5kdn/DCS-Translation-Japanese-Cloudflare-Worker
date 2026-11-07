-- TREE_METADATA_DBに適用する。送信元IPはSHA-256でハッシュ化して保存する。
CREATE TABLE IF NOT EXISTS v2_write_attempts (
  id INTEGER PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_v2_write_attempts_ip_time ON v2_write_attempts (ip_hash, attempted_at);
CREATE INDEX IF NOT EXISTS idx_v2_write_attempts_time ON v2_write_attempts (attempted_at);
