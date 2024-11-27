import express from "express";
import pg from "pg";
import env from "dotenv";

import multer from "multer";
import path from "path"

const router = express.Router();

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

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

db.connect();

    const Authenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect("/");
    };

    router.get("/profile", Authenticated, async(req, res)=>{
            try {
                const result = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [req.user.id]
                );
                    const profile = result.rows[0];
                    res.render("profile.ejs", {Load: profile})
            } catch (error) {
                console.log(error)
            }
    });

    router.get("/listing", Authenticated, async(req, res)=>{
        try {
            const Profile_Result = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                [req.user.id]
            );
            const profile = Profile_Result.rows[0];

            const Result = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id ORDER BY name ASC");
            const All_User = Result.rows;
            res.render("listing.ejs", {User: All_User, Load: profile})
        } catch (error) {
            
        }
    })
 
export default router;
