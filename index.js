import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

import multer from "multer";
import path from "path"


const app = express();
const port = 3000;
const saltRounds = 10;

const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'public/image');
    },

    filename: (req, file, cb)=>{
        const filename = Date.now() + path.extname(file.originalname);;
        cb(null, filename);
    },
})


const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb)=>{
        const allowedFileTypes = /jpeg|jpg|png|gif/;
        const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedFileTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error("Invalid File Type."))
    }
    },
    limits: { fileSize: 8 * 1024 * 1024},
})

env.config();

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // ms * s * m * h * d 
      }
    })
  );

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(`public`));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
var currentSession;
db.connect();

    // Page for login/register + google
    app.get("/", (req, res)=>{
        if (req.isAuthenticated()) {
            res.redirect("/blog")
        } else {
            res.render("index.ejs")
        }
    })

    // Page for profile + setting
    app.get("/blog", async(req, res)=>{

        if (req.isAuthenticated()){
            try {
                const All_Blog = await db.query("SELECT * FROM blog_post ORDER BY blog_id ASC")
                const result = await db.query("SELECT * FROM profile WHERE user_id = $1", 
                    [currentSession]
                );
                if (result.rows.length > 0){
                    const profile = result.rows[0];
                    const Blogs = All_Blog.rows;
                    console.log(profile)
                    res.render("blog.ejs", {Load: profile, Blog: Blogs})
                } 
                else {
                    console.log("Profile not found")
                    res.redirect("/")
                }
            } catch (error) {
                console.log(error)
            }
        }
        else{
            res.redirect("/")
        }
    })

    app.get("/blog/:id", async(req, res)=>{
        
        if (req.isAuthenticated()){
            try {
                const blogID = req.params.id;
    
                console.log("Blog ID: " + blogID)
    
                console.log ("SessionID: " + currentSession)
    
                const All_Blog = await db.query("SELECT * FROM blog_post WHERE blog_id = $1",
                    [blogID]
                )
                const result = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [currentSession]
                );
    
                if (All_Blog.rows.length === 0) {
                    console.error("Blog not found:", blogID);
                    return res.redirect("/blog");
                } else {
                const blog = All_Blog.rows[0];
                const profile = result.rows[0]
                res.render("post.ejs", {Blog: blog, Load: profile});
                }
            } catch (error) {
                console.log(error)
            };
        }
        else{
            res.redirect("/")
        }

    });

    app.get("/profile", async(req, res)=>{
        if (req.isAuthenticated()){
            try {
                const result = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [currentSession]
                );
                    const profile = result.rows[0];
                    res.render("profile.ejs", {Load: profile})
            } catch (error) {
                console.log(error)
            }
        }
        else{
            res.redirect("/")
        }
    })
        app.post("/changepfp", upload.single('profile_picture') ,async(req, res)=>{
            if (!req.file)  {
                console.error('No file uploaded')
            }

            const upload_pfp = req.file.filename;
            console.log(upload_pfp)

            try {
                await db.query(
                    `UPDATE profile SET profile_picture = $1 WHERE user_id = $2`,
                    [upload_pfp, currentSession]
                ) // FINALLY
                res.redirect("/profile");
            } catch (error) {
                console.log(error)
            } 
        });

        app.post("/profile_setting", async(req, res)=>{
            const Setting = {
                Fullname: req.body.fullname,
                Nickname: req.body.nickname, 
                Gender: req.body.Gender,
                timezone: req.body.timezone_offset,
                CurrentUser: currentSession
            }
            try {
                await db.query(
                    "UPDATE account SET name = $1 WHERE id = $2",
                    [Setting.Fullname, Setting.CurrentUser] 
                )
                await db.query(
                    "UPDATE profile SET nickname = $1, gender = $2, timezone = $3 WHERE user_id = $4",
                    [Setting.Nickname, Setting.Gender, Setting.timezone, Setting.CurrentUser]
                )
                console.log(`Profile Updated, ${Setting.Nickname}`)
                res.redirect("/profile")
            } catch (error) {
             console.log(error)   
            }
        });
    
    // Edit Page
    app.get(`/profile/edit`, async(req, res)=>{
        if (req.isAuthenticated()) {
            try {
                const profile_search = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [currentSession]
                );
                const profile = profile_search.rows[0];
    
                const Blog_Loader = await db.query("SELECT * FROM blog_post WHERE user_post = $1",
                    [currentSession]
                );
    
                const Blog = Blog_Loader.rows;
                let Search = null;
                // const Search = {
                //     blog_id: req.query.blog_id || null,
                //     title: req.query.title || null,
                //     Search_Blog: await db.query("SELECT * FROM blog_post WHERE blog_id = $1",
                //         [Search.blog_id] || null
                //     )
                // };
                if (req.query.blog_id) {
                    const Blog_Search = await db.query("SELECT * FROM blog_post WHERE blog_id = $1",
                        [req.query.blog_id]
                    );
                    Search = Blog_Search.rows[0] || null;
                };
    
                res.render(`edit.ejs`, {Load: profile, Blog: Blog, Search: Search});
            } catch (error) {
                console.log("Profile Not Found" + error)
                console.log(currentSession)
                res.redirect("/profile")
            }
        } else {
            res.redirect("/")
        }
    });
        app.post("/find", async(req, res)=>{
            try {
                const Receive ={
                    Blog_ID: req.body.id,
                };
                const Blog_Search = await db.query("SELECT * FROM blog_post WHERE blog_id = $1", 
                    [Receive.Blog_ID]
                );
                const Render_Search = Blog_Search.rows[0]

                    if (Render_Search) {
                        res.redirect(`/profile/edit?blog_id=${Render_Search.blog_id}&title=${Render_Search.title}`);
                    }
                    else{
                        console.log("ID not Found from DB")
                        res.redirect("/profile/edit")
                    }

            } catch (error) {
                console.log("ID not Found");
                res.redirect("/profile/edit")
            }
        });

        app.post("/change-blog", upload.single('new_image'), async(req, res)=>{
            console.log(`Blog ID: ${req.body.blog_id}`)
            try {
                console.log(req.file.filename);
                const oldImageResult  = await db.query("SELECT blog_image FROM blog_post WHERE blog_id = $1",
                    [req.body.blog_id]
                );
                const OldImage = oldImageResult.rows[0].blog_image;

                let Change = {
                    ID: req.body.blog_id,
                    Title: req.body.Title,
                    Description: req.body.Description,
                    Tags: req.body.tags,
                    Image: req.file.filename,
                    Content: req.body.content,
                    Old_Image: OldImage
                };

                if (!req.file.filename) {
                    console.log(Change.Old_Image)
                    Change.Image = Change.Old_Image; // If no new image, use the old image
                    await db.query("UPDATE blog_post SET title = $1, descriptions = $2, tags = $3, blog_image = $4, content = $5 WHERE blog_id = $6",
                        [Change.Title, Change.Description, Change.Tags, Change.Image, Change.Content, Change.ID]
                    )
                } else {
                    await db.query("UPDATE blog_post SET title = $1, descriptions = $2, tags = $3, blog_image = $4, content = $5 WHERE blog_id = $6",
                        [Change.Title, Change.Description, Change.Tags, Change.Image, Change.Content, Change.ID]
                    )
                }

                res.redirect("/profile/edit")

            } catch (error) {
                console.log(error)
                res.redirect("/profile/")
            }
        })
    // History Page + Delete Button
    app.get("/profile/history", async(req, res)=>{
        if (req.isAuthenticated()){
            try {
                const All_Blog = await db.query("SELECT * FROM blog_post WHERE user_post = $1",
                    [currentSession]
                )

                const result = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [currentSession]
                );
                    const profile = result.rows[0];
                    const Blog = All_Blog.rows;
                    res.render("history.ejs", {Load: profile, Blog: Blog})
            } catch (error) {
                console.log(error)
            }
        }
        else{
            res.redirect("/")
        }
    })
    app.get("/delete/:id", async(req, res)=>{
        try {
            const blogID = req.params.id;

            console.log("Blog ID: " + blogID)

            console.log ("SessionID: " + currentSession)

            await db.query("DELETE FROM blog_post WHERE blog_id = $1",
                [blogID]
            )

            res.redirect(`/profile/history`)
        } catch (error) {
            console.log(error)
            res.redirect(`/profile/history`)
        };
    })

    // Logout
    app.get("/leave", (req, res)=>{
        req.logout(function(err){
            if(err){
                return next(err)
            }
            currentSession = null;
            console.log(currentSession)
            res.redirect("/")
        })
    })

    // Post
    app.get("/post", async(req, res)=>{
        if (req.isAuthenticated()){
            try {
                const result = await db.query("SELECT * FROM profile WHERE user_id = $1", 
                    [currentSession]
                );
                if (result.rows.length > 0){
                    const profile = result.rows[0];
                    console.log(profile)
                    res.render("upload_blog.ejs", {Load: profile})
                } 
                else {
                    console.log("Not found")
                    res.redirect("/")
                }
            } catch (error) {
                console.log(error)
            }
        }
        else{
            res.redirect("/")
        }
    })
        app.post("/add", upload.single('image') ,async(req, res)=>{
            if (!req.file)  {
                console.error('No file uploaded')
            }
            try {
                const User = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [currentSession]
                );
            const Content = {
                // you!
                user_id: currentSession,
                User: User.rows[0].name,


                // what YOU send
                Title: req.body.Title,
                Description: req.body.Description,
                Tags: req.body.tags,
                Image: req.file.filename,
                Content: req.body.content
            };

            console.log(Content.User)
            console.log(Content.Image)
                const Similarity = await db.query("SELECT * FROM blog_post WHERE title = $1", 
                    [Content.Title])
                if (Similarity.rows.length>0) {
                    console.log("Name Taken!")
                    res.redirect("/post");
                } else {

                    await db.query("INSERT INTO blog_post (user_post, username, time_post, title, descriptions, tags, blog_image, content) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)",
                        [Content.user_id, Content.User, Content.Title, Content.Description, Content.Tags, Content.Image, Content.Content]
                    )
                    redirect("/blog.ejs")
                }
            } catch (error) {
                res.redirect("/post")
            }
        })


    // /register 
        app.post("/register", async(req, res)=>{
            const register = {
                email: req.body.email,
                username: req.body.username,
                password: req.body.password
            }
            try {
                const AccountMatch = await db.query("SELECT * FROM account WHERE email = $1",
                    [register.email]
                );
                if (AccountMatch.rows.length > 0) {
                    res.redirect("/");
                } else {
                    bcrypt.hash(register.password, saltRounds, async (err, hash)=>{
                        if (err) {
                            console.error("Error Hasing Password", err);
                        } else {
                            const Send = await db.query("INSERT INTO account (name, email, password) VALUES ($1, $2, $3) RETURNING *",
                                [register.username, register.email, hash]
                            );
                            const user = Send.rows[0]; 

                            await db.query(
                                "INSERT INTO profile (user_id, profile_picture, nickname, register_date) VALUES ($1, $2, $3, CURRENT_DATE)",
                                [user.id, 'Default.png', user.name]
                            );

                            req.login(user, (err)=>{
                                if (err) {
                                    console.error("Login Error", err);
                                    res.redirect("/");
                                } else {
                                    currentSession = user.id;
                                    console.log("Success!");
                                    res.redirect("/blog");
                                }
                            });
                        };
                    });
                };
            } catch (error) {
                console.log(error)
            }
        })
        // /login
        app.post(
            "/login",
            passport.authenticate("local", {
                successRedirect: "/blog",
                failureRedirect: "/",
            })
            );
        // Google Secret
        app.get("/auth/google", passport.authenticate("google", {
            scope: ["profile", "email"],
        }));

        app.get("/auth/google/secrets", passport.authenticate("google", {
            successRedirect: "/blog",
            failureRedirect: "/",
        }));

        // local login method
        passport.use(
            "local",
            new Strategy(
              { usernameField: "email", passwordField: "password" }, // Specify field names
              async function verify(email, password, cb) {
                try {
                  const result = await db.query("SELECT * FROM account WHERE email = $1", [email]);
                  if (result.rows.length > 0) {
                    const user = result.rows[0];
                    const storedHashedPassword = user.password;
                    bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                      if (err) {
                        console.error("Error during password comparison:", err);
                        return cb(err);
                      }
                      if (valid) {
                        currentSession = user.id;
                        console.log(currentSession)
                        console.log("Success Login!")
                        return cb(null, user);
                      } else {
                        return cb(null, false);
                      }
                    });
                  } else {
                    return cb(null, false);
                  }
                } catch (error) {
                  console.error(error);
                  return cb(error);
                }
              }
            )
          );
          // Google login methog
          passport.use(
            "google",
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: "http://localhost:3000/auth/google/secrets",
                    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
                },
                async(accessToken, refreshToken, profile, cb)=>{
                    try {
                        console.log(profile);
                        const result = await db.query("SELECT * FROM account WHERE email = $1",
                            [profile.email]
                        );
                        if (result.rows.length === 0){
                            const newUser = await db.query(
                                "INSERT INTO account (name, email, password) VALUES ($1, $2, $3) RETURNING *",
                                [profile.displayName, profile.email, "GOOGLE-METHOD"]
                            );
                            const profile_input = newUser.rows[0]
                            console.log(profile_input)
                            await db.query(
                                "INSERT INTO profile (user_id, profile_picture, nickname, register_date) VALUES ($1, $2, $3, CURRENT_DATE)",
                                [profile_input.id, 'Default.png', profile_input.name]
                            );
                            currentSession = profile_input.id;
                            return cb(null, newUser.rows[0]);
                        } else {
                            const session = result.rows[0]
                            console.log(currentSession)
                            currentSession = session.id;
                            return cb(null, result.rows[0]);
                        };
                    } catch (error) {
                        return cb(error)
                    }
                }
            )
          )
    
        passport.serializeUser((user, cb) => {
            cb(null, user);
          });
          
          passport.deserializeUser((user, cb) => {
            cb(null, user);
          });
          


app.listen(port, ()=>{
    console.log(`${port} Opened`)
})