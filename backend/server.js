
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { rateLimit } = require("express-rate-limit");
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

// Rate limiters
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false
});

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication token is required."
        });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: "typemaster-api",
            audience: "typemaster-users",
            algorithms: ["HS256"]
        });

        if (!decoded.sub) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        req.userId = decoded.sub;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }
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
        console.error("Database health check failed:", error.code || "UNKNOWN");

        res.status(500).json({
            success: false,
            message: "Database health check failed."
        });
    }
});

// User registration
app.post("/api/auth/register", registrationLimiter, async (req, res) => {
    let { username, email, password } = req.body || {};

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

    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({
            success: false,
            message: "Username must be 3-20 characters and contain only letters, numbers or underscores."
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.length > 255 || !emailPattern.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({
            success: false,
            message: "Password must contain 8-72 bytes."
        });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
            [username, email, passwordHash]
        );

        return res.status(201).json({
            success: true,
            message: "Your TypeMaster account has been created!",
            user: result.rows[0]
        });

    } catch (error) {
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

// User login
app.post("/api/auth/login", loginLimiter, async (req, res) => {
    let { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    email = email.trim().toLowerCase();

    if (
        email.length > 255 ||
        password.length === 0 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or password."
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, username, email, password_hash
             FROM users
             WHERE email = $1`,
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { sub: String(user.id) },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
                issuer: "typemaster-api",
                audience: "typemaster-users",
                algorithm: "HS256"
            }
        );

        return res.json({
            success: true,
            message: "Login successful!",
            token,
            expiresIn: "1h",
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login failed:", error.code || "UNKNOWN");

        return res.status(500).json({
            success: false,
            message: "Unable to log in right now."
        });
    }
});

// Protected user profile
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, created_at
             FROM users
             WHERE id = $1`,
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        return res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Profile request failed:", error.code || "UNKNOWN");

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your profile."
        });
    }
});

// Start server
async function startServer() {
    try {
        if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
            throw new Error("Required environment variables are missing.");
        }

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
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
