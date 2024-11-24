![image](https://github.com/user-attachments/assets/b0f8cab5-191d-4ccc-8347-58768e337321)# BlogEJS
This Project mainly utilize Node.js, Express and EJS and various Node Package Module libraries.

# 1. Node.js and Terminal Install
- Make sure you're using the Node.js version at least 20.18.0
--> https://nodejs.org/en
- Make sure you also have Terminal environment such as Git Bash.
--> https://git-scm.com/downloads

# 2. Set up NPM
- This step is to install the Node.js 3rd party libraries.
- For this Project, I used the following libraries:
1. bcrypt
2. body-parser
3. dotenv 
4. ejs
5. express
6. express-session
7. multer
8. nodemon (Optional)
9. passport
10. passport-google-oauth2
11. passport-local
12. pg (PostgreSQL Database)

```bash
npm install 
```

```bash
# If the package didn't install the libraries
npm i bcrypt body-paser dotenv ejs express express-session multer passport passport-google-oauth2 passport-local pg
npm i nodemon # Optional
```

- It'll automatically install all the libraries according to the JSON.


# 3. Step up the an .env while and fill in the root.
- Ensure you have PostgreSQL PG-ADMIN 4 opened in your local environment
- And you can set up GOOGLE SECURITY in Google Cloud by starting a new project
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret
PG_USER=your-postgres-username
PG_HOST=localhost
PG_DATABASE=mydatabase
PG_PASSWORD=your-postgres-password
PG_PORT=5432
```


# 4. Once all the following step is done, do the following in terminal
nodemon index.js




