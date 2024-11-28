import express from "express";
import session from "express-session";
import env from "dotenv";
import passport from "passport";

import authRoutes from "./routes/auth.js";
import blogRoutes from "./routes/blog.js";
import profileRoutes from "./routes/profile.js";
import postRoutes from "./routes/post.js";
import listRoutes from "./routes/listing.js"

const app = express();
const port = 3000;

env.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // ms * s * m * h * d 
      },
    })
  );

app.use(passport.initialize());
app.use(passport.session());
  

app.use(authRoutes); // use auth.js from routes
app.use(blogRoutes); // use blog.js from routes
app.use(profileRoutes); // render profile and profile setting features
app.use(postRoutes); 
app.use(listRoutes);

app.use(express.static(`public`));



app.listen(port, ()=>{
    console.log(`${port} Opened`)
})
