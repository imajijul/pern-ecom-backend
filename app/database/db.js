import { Pool } from "pg"
export const dbconnect = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "702876",
    database: "ecomdb",

    // connectionString: "postgresql://neondb_owner:npg_lXk8tbf2UrTQ@ep-floral-pond-avki6esm-pooler.c-11.us-east-1.aws.neon.tech/blogs?sslmode=require&channel_binding=require",
    // ssl: {
    //     rejectUnauthorized: false
    // },
    // max: 10,
    // idleTimeoutMillis: 30000,
    // connectionTimeoutMillis: 10000,
})

dbconnect.on("error", (err) => {
  console.error("Unexpected idle client error:", err);
});