-- Contact (/contact) and quote (/services) form messages
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  package TEXT NOT NULL DEFAULT '',
  event TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT ''
);
CREATE INDEX messages_ip_time ON messages (ip, created_at);
