





-- PROTOTYPE-1: DISCARDED
CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    method VARCHAR(6) CHECK (method IN ('Local', 'Google'))
);

ALTER SEQUENCE account_id_seq RESTART WITH 1001;

CREATE TABLE profile (
    account_id INT PRIMARY KEY REFERENCES account(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE REFERENCES account(username) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE REFERENCES account(email) ON DELETE CASCADE,
    profile_picture VARCHAR(255),
    mode VARCHAR(5) CHECK (mode IN ('Light', 'Dark')) DEFAULT 'Light',
    about_user VARCHAR(360),
    description VARCHAR(500),
    post_made INT,
    register_date DATE
);

CREATE TABLE blog (
    post_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES account(id) ON DELETE CASCADE,
    username VARCHAR(255) REFERENCES account(username) ON DELETE CASCADE,
    images VARCHAR(255),
    upload_date DATE,
    title VARCHAR(70),
    small_description VARCHAR(155),
    tags VARCHAR(20),
    likes INT,
    dislikes INT
);

ALTER SEQUENCE post_id_blog RESTART WITH 100001;

CREATE TABLE sub_blog (
    sub_blog_id SERIAL PRIMARY KEY,
    post_id INT REFERENCES blog(post_id) ON DELETE CASCADE,
    account_id INT REFERENCES account(id) ON DELETE CASCADE,
    username VARCHAR(255) REFERENCES account(username) ON DELETE CASCADE,
    images VARCHAR(255),
    upload_date DATE,
    title VARCHAR(70),
    small_description VARCHAR(155),
    tags VARCHAR(20),
    likes INT,
    dislikes INT,
    content VARCHAR(2000)
);


CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES account(id) ON DELETE CASCADE,
    post_id INT REFERENCES blog(post_id) ON DELETE CASCADE,
    upload_date DATE,
    delete_date DATE,
    title VARCHAR(70)
);

CREATE TABLE admin (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    password VARCHAR(255)
);

INSERT INTO account (username, email, password, method) 
VALUES ('Nerdanta', 'nerdanta@example.com', '123456', 'Local');

INSERT INTO profile (account_id, username, email, profile_picture, mode, about_user, description, post_made, register_date) 
VALUES (1001, 'Nerdanta', 'nerdanta@example.com', 'profile_pic.jpg', 'Light', 'About Nerdanta', 'Profile description for Nerdanta', 0, CURRENT_DATE);

INSERT INTO blog (account_id, username, images, upload_date, title, small_description, tags, likes, dislikes) 
VALUES (1001, 'Nerdanta', 'image1.jpg', CURRENT_DATE, 'First Blog Post', 'This is a small description of the first blog post.', 'Tech', 0, 0);

INSERT INTO sub_blog (post_id, account_id, images, username, upload_date, title, small_description, tags, likes, dislikes, content) 
VALUES (100001, 1001, 'image1.jpg', 'Nerdanta', CURRENT_DATE, 'First Blog Post', 'This is a small description of the first blog post.', 'Tech', 0, 0, 'This is the content of the first blog post.');

INSERT INTO history (account_id, post_id, upload_date, delete_date, title) 
VALUES (1001, 100001, CURRENT_DATE, NULL, 'First Blog Post');

INSERT INTO admin (email, password) 
VALUES ('admin@example.com', 'adminpassword');

-- PROTOTYPE-2:
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
