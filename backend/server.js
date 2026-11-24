
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

// Handle unexpected database connection errors
pool.on("error", (error) => {
    console.error("Unexpected database error:", error.message);
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

// Database connection check
app.get("/api/db-health", async (req, res) => {
    if (!process.env.DATABASE_URL) {
        return res.status(503).json({
            success: false,
            message: "Database URL is not configured."
        });
    }

    try {
        const result = await pool.query("SELECT NOW() AS current_time");

        res.json({
            success: true,
            message: "TypeMaster database connected successfully!",
            database: "PostgreSQL",
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not connect to the database."
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`TypeMaster server running on port ${PORT}`);
});
