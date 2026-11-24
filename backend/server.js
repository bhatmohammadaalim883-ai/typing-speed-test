
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on("error", (error) => {
    console.error("Unexpected database error:", error.code || "UNKNOWN");
});

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
        console.error("Database health check failed:", error.code || "UNKNOWN");

        res.status(500).json({
            success: false,
            message: "Database health check failed."
        });
    }
});

// User registration API
app.post("/api/auth/register", async (req, res) => {
    const body = req.body || {};

    let { username, email, password } = body;

    // Check required fields
    if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Username, email and password are required."
        });
    }

    // Normalize username and email
    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    // Validate username
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({
            success: false,
            message: "Username must be 3-20 characters and contain only letters, numbers or underscores."
        });
    }

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.length > 255 || !emailPattern.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    // Validate password
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 8 characters."
        });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({
            success: false,
            message: "Password is too long."
        });
    }

    try {
        // Hash the password before storing it
        const passwordHash = await bcrypt.hash(password, 12);

        // Insert user into PostgreSQL
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
            [username, email, passwordHash]
        );

        const user = result.rows[0];

        return res.status(201).json({
            success: true,
            message: "Your TypeMaster account has been created!",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });

    } catch (error) {
        // PostgreSQL unique constraint violation
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "This username or email is already registered."
            });
        }

        console.error("Registration failed:", error.code || "UNKNOWN");

        return res.status(500).json({
            success: false,
            message: "Unable to create your account right now."
        });
    }
});

// Initialize database and start server
async function startServer() {
    try {
        await pool.query("SELECT 1");

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

        app.listen(PORT, () => {
            console.log(`TypeMaster server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.code || "UNKNOWN");
        process.exit(1);
    }
}

startServer();
