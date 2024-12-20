import express from "express";
import env from "dotenv";
import fs from "fs";
import multer from "multer";
import path from "path"
import itemsPool from "../DBConfig.js";

const __dirname = path.resolve();

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

    router.get("/profile", Authenticated, async(req, res)=>{
            try {
                const result = await itemsPool.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [req.user.id]
                );
                    const profile = result.rows[0];
                    res.render("profile.ejs", {Load: profile})
            } catch (error) {
                console.log(error)
            }
    });

    router.post("/changepfp", upload.single('profile_picture') ,async(req, res)=>{
        if (!req.file)  {
            console.error('No file uploaded')
        }

        const upload_pfp = req.file.filename;
        console.log(upload_pfp)

        try {
            const result = await itemsPool.query(
                `SELECT * FROM profile WHERE user_id = $1`,
                [req.user.id]
            )
            const Old_Profile = result.rows[0];
            console.log(`Old PFP ${Old_Profile.profile_picture}`)

            if (Old_Profile.profile_picture !== 'Default.png'){

                const oldFilePath = path.join(__dirname, 'public', 'image', Old_Profile.profile_picture);
                fs.unlink(oldFilePath, (error)=>{
                    if(error){
                        console.error(`Error Deleting Old PFP: ${error}`);
                    }
                    console.log("Successfully Replaced Old File")
                });
            };

            await itemsPool.query(
                `UPDATE profile SET profile_picture = $1 WHERE user_id = $2`,
                [upload_pfp, req.user.id]
            ) // FINALLY
            res.redirect("/profile");
        } catch (error) {
            console.log(error)
        } 
    });

    router.post("/profile_setting", async(req, res)=>{
        const Setting = {
            Fullname: req.body.fullname,
            Nickname: req.body.nickname, 
            Gender: req.body.Gender,
            timezone: req.body.timezone_offset,
            CurrentUser: req.user.id
        }
        try {
            await itemsPool.query(
                "UPDATE account SET name = $1 WHERE id = $2",
                [Setting.Fullname, Setting.CurrentUser] 
            )
            await itemsPool.query(
                "UPDATE profile SET nickname = $1, gender = $2, timezone = $3 WHERE user_id = $4",
                [Setting.Nickname, Setting.Gender, Setting.timezone, Setting.CurrentUser]
            )
            console.log(`Profile Updated, ${Setting.Nickname}`)
            res.redirect("/profile")
        } catch (error) {
         console.log(error)   
        }
    });

    router.get(`/profile/edit`, Authenticated,async(req, res)=>{
        
            try {
                const profile_search = await itemsPool.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [req.user.id]
                );
                const profile = profile_search.rows[0];
    
                const Blog_Loader = await itemsPool.query("SELECT * FROM blog_post WHERE user_post = $1",
                    [req.user.id]
                );
    
                const Blog = Blog_Loader.rows;
                let Search = null;
                if (req.query.blog_id) {
                    const Blog_Search = await itemsPool.query("SELECT * FROM blog_post WHERE blog_id = $1",
                        [req.query.blog_id]
                    );
                    Search = Blog_Search.rows[0] || null;
                };
    
                res.render(`edit.ejs`, {Load: profile, Blog: Blog, Search: Search});
            } catch (error) {
                console.log("Profile Not Found" + error)
                console.log(req.user.id)
                res.redirect("/profile")
            }
    });

    router.post("/find", async(req, res)=>{
        try {
            const Receive ={
                Blog_ID: req.body.id,
            };
            const Blog_Search = await itemsPool.query("SELECT * FROM blog_post WHERE blog_id = $1", 
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

    router.post("/change-blog", upload.single('new_image'), async(req, res)=>{
        console.log(`Blog ID: ${req.body.blog_id}`)
        try {
            let Change = {
                ID: req.body.blog_id,
                Title: req.body.Title,
                Description: req.body.Description,
                Tags: req.body.tags,
                Content: req.body.content,
            };
            const oldImageResult  = await itemsPool.query("SELECT blog_image FROM blog_post WHERE blog_id = $1",
                [req.body.blog_id]
            );
            if (!req.file)  {
                const OldImage = oldImageResult.rows[0].blog_image;
                    console.log(Change.Old_Image)
                    Change.Image = Change.Old_Image; // If no new image, use the old image
                    await itemsPool.query("UPDATE blog_post SET title = $1, descriptions = $2, tags = $3, blog_image = $4, content = $5 WHERE blog_id = $6",
                        [Change.Title, Change.Description, Change.Tags, OldImage, Change.Content, Change.ID]
                    );
                res.redirect("/profile/edit")
            }
            if (req.file.filename){
                const Old_Image = oldImageResult.rows[0];
                console.log(`Old PFP ${Old_Image.blog_image}`)

                const oldFilePath = path.join(__dirname, 'public', 'image', Old_Image.blog_image);
                fs.unlink(oldFilePath, (error)=>{
                    if(error){
                        console.error(`Error Deleting Old Blog Image: ${error}`);
                    }
                    console.log("Successfully Replaced Old Image")
                });

                let NewImage = req.file.filename;
                await itemsPool.query("UPDATE blog_post SET title = $1, descriptions = $2, tags = $3, blog_image = $4, content = $5 WHERE blog_id = $6",
                    [Change.Title, Change.Description, Change.Tags, NewImage, Change.Content, Change.ID]
                );
                res.redirect("/profile/edit")
            } else {
                res.send(401);
            }
        } catch (error) {
            console.log(error)
            res.redirect("/profile/edit")
        }
    });
    router.get("/profile/history", Authenticated,async(req, res)=>{
            try {
                const All_Blog = await itemsPool.query("SELECT * FROM blog_post WHERE user_post = $1",
                    [req.user.id]
                )

                const result = await itemsPool.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [req.user.id]
                );
                    const profile = result.rows[0];
                    const Blog = All_Blog.rows;
                    res.render("history.ejs", {Load: profile, Blog: Blog})
            } catch (error) {
                console.log(error)
            }
    });
    router.get("/delete/:id", async(req, res)=>{
        try {
            const blogID = req.params.id;

            console.log("Blog ID: " + blogID)

            console.log ("SessionID: " + req.user.id)

            await itemsPool.query("DELETE FROM blog_post WHERE blog_id = $1",
                [blogID]
            )

            res.redirect(`/profile/history`)
        } catch (error) {
            console.log(error)
            res.redirect(`/profile/history`)
        };
    });
 
export default router;
