import "dotenv/config";
import mysql from "mysql2/promise";

const dbName = process.env.DB_NAME || "ccs_profiling";
const port = Number(process.env.DB_PORT || 3306);

const bootstrapConn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port,
  namedPlaceholders: true,
});

await bootstrapConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
await bootstrapConn.end();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: dbName,
  port,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

