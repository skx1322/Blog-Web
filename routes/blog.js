import express from "express";
import env from "dotenv";
import itemsPool from "../DBConfig.js";

const router = express.Router();


env.config();

    const Authenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect("/");
    };

    // Page for profile + setting
    router.get("/blog", Authenticated ,async(req, res)=>{
        try {
            let sorting_order = {
                sorting: req.query.sorting || null,
                type: "blog_id",
                sort: "ASC",
            }

            switch (sorting_order.sorting) {
                case 'ASC' :
                    sorting_order.type = 'title';
                    sorting_order.sort = 'ASC'
                    break;
                case 'DESC' :
                    sorting_order.type = 'title';
                    sorting_order.sort = 'DESC'
                    break;
                case 'NEW' :
                    sorting_order.type = 'time_post';
                    sorting_order.sort = 'DESC'
                    break;
                case 'OLD' :
                    sorting_order.type = 'time_post';
                    sorting_order.sort = 'ASC'
                    break;
                default:
                    sorting_order.type = 'blog_id';
                    sorting_order.sort = 'ASC';
                    break;
            }

            const All_Blog = await itemsPool.query(`SELECT * FROM blog_post ORDER BY ${sorting_order.type} ${sorting_order.sort}`
            );
            const result = await itemsPool.query("SELECT * FROM profile WHERE user_id = $1", 
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

    router.post("/sort", async(req, res)=>{
        const sorting = req.body.sorting;
        res.redirect(`/blog?sorting=${sorting}`);
    })

    // router.post("/search", async(req, res)=>{
    //     const search = req.body.searchTerm;
    //     res.redirect(`/blog?search=${search}`);
    // })

    router.get("/blog/:id", Authenticated, async(req, res)=>{
            try {
                const blogID = req.params.id;
    
                console.log("Blog ID: " + blogID)
    
                console.log ("SessionID: "+ req.user.id)
    
                const All_Blog = await itemsPool.query("SELECT * FROM blog_post WHERE blog_id = $1",
                    [blogID]
                )
                const result = await itemsPool.query("SELECT * FROM account INNER JOIN profile ON account.id = profile.user_id WHERE user_id = $1", 
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
