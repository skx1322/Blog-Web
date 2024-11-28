import pkg from "pg";
import env from "dotenv";

env.config();

const { Pool } = pkg;

const itemsPool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl:{
        rejectUnauthorized: false
    }
});

export default itemsPool;