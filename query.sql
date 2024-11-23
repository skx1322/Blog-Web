
-- Simnple DB Designing -- :
CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    name VARCHAR(40) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) UNIQUE NOT NULL
);

ALTER SEQUENCE account_id_seq RESTART WITH 1001;

CREATE TABLE profile (
    user_id INT PRIMARY KEY REFERENCES account(id),
    profile_picture VARCHAR(255) DEFAULT 'Default.png',
    nickname VARCHAR(40),
    timezone VARCHAR(100),
    register_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_post (
    blog_id SERIAL PRIMARY KEY,
    user_post INT,
    username VARCHAR(40),
    time_post DATE,
    title VARCHAR(40),
    descriptions VARCHAR(120),
    tags VARCHAR(30),
    blog_image VARCHAR(255),
    content VARCHAR(65535)
);

ALTER SEQUENCE blog_Post_blog_id_seq RESTART WITH 100001;

-- CREATE TABLE Blog_Content (
--     blog_id INT REFERENCES Blog_Post(blog_id),
--     user_post INT REFERENCES Blog_Post(user_post),
--     username VARCHAR REFERENCES Blog_Post(username),
--     time_post DATE REFERENCES Blog_Post(time_post),
--     title VARCHAR REFERENCES Blog_Post(title),
--     description VARCHAR REFERENCES Blog_Post(description),
--     tags VARCHAR Blog_Post(tags),
--     blog_image VARCHAR REFERENCES blog_image(Blog_Post),
--     content VARCHAR(65535)
-- )
