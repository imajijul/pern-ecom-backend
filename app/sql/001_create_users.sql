CREATE TABLE users(
	id SERIAL PRIMARY KEY,
	name VARCHAR(200),
	email VARCHAR(250),
	phone VARCHAR(11),
	password VARCHAR(50),
	role TEXT NOT NULL DEFAULT 'user' CHECK(role in ('user', 'admin', 'editor')),
	refresh_token TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
)