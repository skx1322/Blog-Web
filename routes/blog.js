import express from "express";
import pg from "pg";
import env from "dotenv";

const router = express.Router();


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

    // Page for profile + setting
    router.get("/blog", Authenticated ,async(req, res)=>{
            try {
                const All_Blog = await db.query("SELECT * FROM blog_post ORDER BY blog_id ASC")
                const result = await db.query("SELECT * FROM profile WHERE user_id = $1", 
                    [req.user.id]
                );
                if (result.rows.length > 0){
                    const profile = result.rows[0];
                    const Blogs = All_Blog.rows;
                    res.render("blog.ejs", {Load: profile, Blog: Blogs})
                } 
                else {
                    console.log("Profile not found")
                    res.redirect("/")
                }
            } catch (error) {
                console.log(error)
            }
    })

    router.get("/blog/:id", Authenticated, async(req, res)=>{
            try {
                const blogID = req.params.id;
    
                console.log("Blog ID: " + blogID)
    
                console.log ("SessionID: "+ req.user.id)
    
                const All_Blog = await db.query("SELECT * FROM blog_post WHERE blog_id = $1",
                    [blogID]
                )
                const result = await db.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
                    [req.user.id]
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
    });
 
export default router;
