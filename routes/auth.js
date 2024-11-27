import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import env from "dotenv";

const router = express.Router();
const saltRounds = 10;


env.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

db.connect();


    // Page for login/register + google
    router.get("/", (req, res)=>{
        if (req.isAuthenticated()) {
            res.redirect("/blog")
        } else {
            res.render("index.ejs")
        }
    })
    // Logout
    router.get("/leave", (req, res)=>{
        req.logout(function(err){
            if(err){
                return next(err)
            }
            res.redirect("/")
        })
    })
    // /register 
    router.post("/register", async(req, res)=>{
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
        });
    // /login
    router.post(
        "/login",
        passport.authenticate("local", {
            successRedirect: "/blog",
            failureRedirect: "/",
        })
        );
    // Google Secret
    router.get("/auth/google", passport.authenticate("google", {
        scope: ["profile", "email"],
    }));

    router.get("/auth/google/secrets", passport.authenticate("google", {
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

                    console.log(`Hello ${user.name}, Your ID is ${user.id}`);
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
                        await db.query(
                            "INSERT INTO profile (user_id, profile_picture, nickname, register_date) VALUES ($1, $2, $3, CURRENT_DATE)",
                            [profile_input.id, 'Default.png', profile_input.name]
                        );
                        return cb(null, newUser.rows[0]);
                    } else {
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
        
        passport.deserializeUser(async (account, cb) => {
        try {
            const result = await db.query("SELECT * FROM account WHERE id = $1", 
                [account.id]
            );
            const user = result.rows[0];
            cb(null, user);
        } catch (error) {
            cb(error)
        }
        });
          

export default router;
