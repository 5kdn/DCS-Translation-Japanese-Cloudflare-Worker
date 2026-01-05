-- Migration number: 0001 	 2025-12-28T17:24:39.163Z
CREATE TABLE IF NOT EXISTS tree_path_updated_at (
	path TEXT PRIMARY KEY,
	updated_at INTEGER NOT NULL
);
