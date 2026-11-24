
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Handle database errors
pool.on("error", (error) => {
    console.error("Unexpected database error:", error.message);
});

// Create users table
async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            username VARCHAR(30) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Users table is ready!");
}

// Home route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to TypeMaster Backend!",
        status: "Running"
    });
});

// API health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "TypeMaster API is working!"
    });
});

// Database health check
app.get("/api/db-health", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                NOW() AS current_time,
                to_regclass('public.users') IS NOT NULL
                AS users_table_exists
        `);

        res.json({
            success: true,
            message: "TypeMaster database connected successfully!",
            database: "PostgreSQL",
            users_table_created: result.rows[0].users_table_exists,
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Database health check failed."
        });
    }
});

// Start server after database initialization
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`TypeMaster server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
