CREATE TABLE comments(
	id SERIAL PRIMARY KEY,
	blog_id INT NOT NULL REFERENCES blogs(id),
	user_id INT NOT NULL REFERENCES users(id),
	comment_text TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
)