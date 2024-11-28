import express from "express";
import env from "dotenv";
import itemsPool from "../DBConfig.js";

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

    const Authenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect("/");
    };

    router.get("/post", Authenticated,async(req, res)=>{
        try {
            const result = await itemsPool.query("SELECT * FROM profile WHERE user_id = $1", 
                [req.user.id]
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
});
router.post("/add", upload.single('image') ,async(req, res)=>{
    if (!req.file)  {
        console.error('No file uploaded')
    }
    try {
        const User = await itemsPool.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
            [req.user.id]
        );
    const Content = {
        // you!
        user_id: req.user.id,
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
        const Similarity = await itemsPool.query("SELECT * FROM blog_post WHERE title = $1", 
            [Content.Title])
        if (Similarity.rows.length>0) {
            console.log("Name Taken!")
            res.redirect("/post");
        } else {

            await itemsPool.query("INSERT INTO blog_post (user_post, username, time_post, title, descriptions, tags, blog_image, content) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)",
                [Content.user_id, Content.User, Content.Title, Content.Description, Content.Tags, Content.Image, Content.Content]
            )
            redirect("/blog.ejs")
        }
    } catch (error) {
        res.redirect("/post")
    }
});
 
export default router;
