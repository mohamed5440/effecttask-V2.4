import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "u123456789_database",
  ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 20000, // 20 seconds timeout for Hostinger/External connections
};

console.log(`[DB] Attempting to connect to MySQL at ${dbConfig.host}:${dbConfig.port}...`);

const pool = mysql.createPool(dbConfig);

// Test connection immediately with detailed feedback
pool.getConnection()
  .then(conn => {
    console.log("[DB] ✅ Successfully connected to MySQL database");
    conn.release();
  })
  .catch(err => {
    console.error("[DB] ❌ FAILED to connect to MySQL database");
    console.error(`[DB] Error: ${err.message}`);
    console.error("[DB] Please verify MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE in your environment variables.");
  });

export default pool;

