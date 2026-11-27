
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

dotenv.config({
    path: path.join(__dirname, ".env")
});

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_DIR = path.join(__dirname, "../frontend");

if (!JWT_SECRET || !process.env.DATABASE_URL) {
    console.error("Missing JWT_SECRET or DATABASE_URL.");
    process.exit(1);
}

// =====================================
// Middleware
// =====================================

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Serve frontend files
app.use(express.static(FRONTEND_DIR));

// =====================================
// PostgreSQL
// =====================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// =====================================
// Rate Limiters
// =====================================

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many registration attempts. Try again later."
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again later."
    }
});

// =====================================
// Daily Challenge Definitions
// =====================================

const dailyChallenges = [
    {
        title: "Accuracy Master",
        description: "Complete a typing challenge with excellent accuracy.",
        wpm: 30,
        accuracy: 95,
        duration: 60,
        points: 50
    },
    {
        title: "Speed Champion",
        description: "Challenge yourself to reach a higher typing speed.",
        wpm: 45,
        accuracy: 90,
        duration: 60,
        points: 75
    },
    {
        title: "Consistency Challenge",
        description: "Maintain steady typing performance throughout your test.",
        wpm: 35,
        accuracy: 97,
        duration: 120,
        points: 100
    },
    {
        title: "Typing Expert",
        description: "Combine good speed with excellent accuracy.",
        wpm: 55,
        accuracy: 95,
        duration: 60,
        points: 125
    },
    {
        title: "Practice Master",
        description: "Complete a longer typing session with consistent accuracy.",
        wpm: 40,
        accuracy: 96,
        duration: 120,
        points: 100
    }
];

// =====================================
// Date Helpers
// =====================================

function getIndiaDateKey() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = {};

    parts.forEach(part => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
}

function getDayNumber(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return Math.floor(
        Date.UTC(year, month - 1, day) / 86400000
    );
}

function getDailyChallenge(dateString) {
    const index = getDayNumber(dateString) % dailyChallenges.length;
    return dailyChallenges[index];
}

function calculateStreak(completedDates) {
    const completed = new Set(completedDates);

    const today = getIndiaDateKey();
    const yesterdayDate = new Date(`${today}T00:00:00Z`);

    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);

    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    let checkDate = completed.has(today) ? today : yesterday;
    let streak = 0;

    while (completed.has(checkDate)) {
        streak++;

        const date = new Date(`${checkDate}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() - 1);

        checkDate = date.toISOString().slice(0, 10);
    }

    return streak;
}

// =====================================
// Database Initialization
// =====================================

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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS typing_tests (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            user_id BIGINT NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
            wpm NUMERIC(6,2) NOT NULL CHECK (wpm >= 0),
            accuracy NUMERIC(5,2) NOT NULL
                CHECK (accuracy >= 0 AND accuracy <= 100),
            duration_seconds INTEGER NOT NULL
                CHECK (duration_seconds > 0),
            language VARCHAR(50) NOT NULL DEFAULT 'English',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_typing_tests_user_created
        ON typing_tests(user_id, created_at DESC);
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_challenge_completions (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            user_id BIGINT NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
            challenge_date DATE NOT NULL,
            challenge_title VARCHAR(100) NOT NULL,
            wpm NUMERIC(7,2) NOT NULL CHECK (wpm >= 0),
            accuracy NUMERIC(5,2) NOT NULL
                CHECK (accuracy >= 0 AND accuracy <= 100),
            duration_seconds INTEGER NOT NULL
                CHECK (duration_seconds > 0),
            points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
            completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (user_id, challenge_date)
        );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date
        ON daily_challenge_completions(user_id, challenge_date DESC);
    `);

    console.log("All TypeMaster database tables initialized.");
}

// =====================================
// Authentication Middleware
// =====================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. Please log in."
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "typemaster-api",
            audience: "typemaster-users"
        });

        req.user = {
            id: decoded.sub
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
}

// =====================================
// Frontend Home Page
// =====================================

app.get("/", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// =====================================
// Health Check
// =====================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "TypeMaster API is running."
    });
});

// =====================================
// Database Health Check
// =====================================

app.get("/api/db-health", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                to_regclass('public.users') AS users_table,
                to_regclass('public.typing_tests') AS typing_tests_table,
                to_regclass('public.daily_challenge_completions')
                    AS challenges_table
        `);

        res.json({
            success: true,
            database: "connected",
            users_table_created: Boolean(result.rows[0].users_table),
            typing_tests_table_created: Boolean(
                result.rows[0].typing_tests_table
            ),
            challenges_table_created: Boolean(
                result.rows[0].challenges_table
            )
        });

    } catch (error) {
        console.error("Database health error:", error.message);

        res.status(500).json({
            success: false,
            database: "error"
        });
    }
});

// =====================================
// User Registration
// =====================================

app.post(
    "/api/auth/register",
    registerLimiter,
    async (req, res) => {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required."
                });
            }

            const cleanUsername = String(username).trim();
            const cleanEmail = String(email).trim().toLowerCase();

            if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
                return res.status(400).json({
                    success: false,
                    message: "Username must be 3-30 characters and contain only letters, numbers or underscores."
                });
            }

            if (
                cleanEmail.length > 255 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid email address."
                });
            }

            if (
                typeof password !== "string" ||
                password.length < 8 ||
                Buffer.byteLength(password, "utf8") > 72
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 8 characters and no more than 72 bytes."
                });
            }

            const existingUser = await pool.query(
                "SELECT id FROM users WHERE email = $1 OR username = $2",
                [cleanEmail, cleanUsername]
            );

            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Username or email is already registered."
                });
            }

            const passwordHash = await bcrypt.hash(password, 12);

            const result = await pool.query(
                `INSERT INTO users (username, email, password_hash)
                 VALUES ($1, $2, $3)
                 RETURNING id, username, email, created_at`,
                [cleanUsername, cleanEmail, passwordHash]
            );

            res.status(201).json({
                success: true,
                message: "Registration successful!",
                user: result.rows[0]
            });

        } catch (error) {
            console.error("Registration error:", error.message);

            if (error.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message: "Username or email is already registered."
                });
            }

            res.status(500).json({
                success: false,
                message: "Registration failed. Please try again."
            });
        }
    }
);

// =====================================
// User Login
// =====================================

app.post(
    "/api/auth/login",
    loginLimiter,
    async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required."
                });
            }

            const cleanEmail = String(email).trim().toLowerCase();

            const result = await pool.query(
                "SELECT * FROM users WHERE email = $1",
                [cleanEmail]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password."
                });
            }

            const user = result.rows[0];

            const passwordMatch = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password."
                });
            }

            const token = jwt.sign(
                {},
                JWT_SECRET,
                {
                    subject: String(user.id),
                    expiresIn: "1h",
                    issuer: "typemaster-api",
                    audience: "typemaster-users",
                    algorithm: "HS256"
                }
            );

            res.json({
                success: true,
                message: "Login successful!",
                token,
                expiresIn: "1h",
                user: {
                    id: String(user.id),
                    username: user.username,
                    email: user.email
                }
            });

        } catch (error) {
            console.error("Login error:", error.message);

            res.status(500).json({
                success: false,
                message: "Login failed. Please try again."
            });
        }
    }
);

// =====================================
// Get Logged-in User Profile
// =====================================

app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, created_at
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            user: {
                ...user,
                id: String(user.id)
            }
        });

    } catch (error) {
        console.error("Profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not retrieve user profile."
        });
    }
});

// =====================================
// Save Typing Test Result
// =====================================

app.post(
    "/api/typing-tests",
    authenticateToken,
    async (req, res) => {
        try {
            const { wpm, accuracy, duration_seconds, language } = req.body;

            const testWpm = Number(wpm);
            const testAccuracy = Number(accuracy);
            const testDuration = Number(duration_seconds);

            const testLanguage = language === undefined
                ? "English"
                : language;

            if (
                !Number.isFinite(testWpm) ||
                testWpm < 0 ||
                testWpm > 9999
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid WPM value."
                });
            }

            if (
                !Number.isFinite(testAccuracy) ||
                testAccuracy < 0 ||
                testAccuracy > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Accuracy must be between 0 and 100."
                });
            }

            if (
                !Number.isInteger(testDuration) ||
                testDuration < 1 ||
                testDuration > 86400
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid test duration."
                });
            }

            if (
                typeof testLanguage !== "string" ||
                testLanguage.trim().length < 1 ||
                testLanguage.trim().length > 50
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid language."
                });
            }

            const result = await pool.query(
                `INSERT INTO typing_tests
                    (user_id, wpm, accuracy, duration_seconds, language)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, wpm, accuracy, duration_seconds,
                           language, created_at`,
                [
                    req.user.id,
                    testWpm,
                    testAccuracy,
                    testDuration,
                    testLanguage.trim()
                ]
            );

            res.status(201).json({
                success: true,
                message: "Typing test result saved!",
                test: result.rows[0]
            });

        } catch (error) {
            console.error("Save typing test error:", error.message);

            res.status(500).json({
                success: false,
                message: "Could not save typing test result."
            });
        }
    }
);

// =====================================
// Get Typing Statistics
// =====================================

app.get(
    "/api/typing-tests/stats",
    authenticateToken,
    async (req, res) => {
        try {
            const statsResult = await pool.query(
                `SELECT
                    COUNT(*)::INTEGER AS total_tests,
                    COALESCE(ROUND(AVG(wpm), 2), 0) AS average_wpm,
                    COALESCE(ROUND(AVG(accuracy), 2), 0)
                        AS average_accuracy
                 FROM typing_tests
                 WHERE user_id = $1`,
                [req.user.id]
            );

            const recentResult = await pool.query(
                `SELECT id, wpm, accuracy, duration_seconds,
                        language, created_at
                 FROM typing_tests
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT 10`,
                [req.user.id]
            );

            res.json({
                success: true,
                stats: statsResult.rows[0],
                recentTests: recentResult.rows
            });

        } catch (error) {
            console.error("Typing statistics error:", error.message);

            res.status(500).json({
                success: false,
                message: "Could not retrieve typing statistics."
            });
        }
    }
);

// =====================================
// Leaderboard
// =====================================

app.get("/api/leaderboard", async (req, res) => {
    try {
        const period = req.query.period || "all-time";

        let dateCondition = "";

        if (period === "daily") {
            dateCondition =
                "AND tt.created_at >= NOW() - INTERVAL '1 day'";
        } else if (period === "weekly") {
            dateCondition =
                "AND tt.created_at >= NOW() - INTERVAL '7 days'";
        } else if (period !== "all-time") {
            return res.status(400).json({
                success: false,
                message: "Invalid leaderboard period."
            });
        }

        const query = `
            SELECT
                u.username,
                COUNT(*)::INTEGER AS total_tests,
                ROUND(AVG(tt.wpm)::numeric, 1) AS average_wpm,
                ROUND(AVG(tt.accuracy)::numeric, 1) AS average_accuracy
            FROM typing_tests tt
            INNER JOIN users u ON u.id = tt.user_id
            WHERE 1=1
            ${dateCondition}
            GROUP BY u.id, u.username
            ORDER BY AVG(tt.wpm) DESC,
                     AVG(tt.accuracy) DESC,
                     COUNT(*) DESC
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            period,
            leaderboard: result.rows
        });

    } catch (error) {
        console.error("Leaderboard error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load leaderboard."
        });
    }
});

// =====================================
// Get Today's Challenge and User Progress
// =====================================

app.get(
    "/api/challenges/me",
    authenticateToken,
    async (req, res) => {
        try {
            const today = getIndiaDateKey();
            const challenge = getDailyChallenge(today);

            const result = await pool.query(
                `SELECT
                    challenge_date::text AS challenge_date,
                    challenge_title,
                    wpm,
                    accuracy,
                    duration_seconds,
                    points,
                    completed_at
                 FROM daily_challenge_completions
                 WHERE user_id = $1
                 ORDER BY challenge_date DESC`,
                [req.user.id]
            );

            const history = result.rows;
            const completedDates = history.map(
                item => item.challenge_date
            );

            const todayCompleted = completedDates.includes(today);

            const totalPoints = history.reduce(
                (total, item) => total + Number(item.points),
                0
            );

            res.json({
                success: true,
                today,
                challenge,
                completedToday: todayCompleted,
                completedCount: history.length,
                totalPoints,
                currentStreak: calculateStreak(completedDates),
                history: history.slice(0, 30)
            });

        } catch (error) {
            console.error("Challenge progress error:", error.message);

            res.status(500).json({
                success: false,
                message: "Could not retrieve challenge progress."
            });
        }
    }
);

// =====================================
// Complete Today's Challenge
// =====================================

app.post(
    "/api/challenges/complete",
    authenticateToken,
    async (req, res) => {
        try {
            const typingTestId = req.body.typing_test_id;

            if (
                !typingTestId ||
                !/^\d+$/.test(String(typingTestId))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "A valid typing test ID is required."
                });
            }

            const today = getIndiaDateKey();
            const challenge = getDailyChallenge(today);

            const testResult = await pool.query(
                `SELECT id, wpm, accuracy, duration_seconds
                 FROM typing_tests
                 WHERE id = $1
                   AND user_id = $2
                   AND (created_at AT TIME ZONE 'Asia/Kolkata')::date
                       = $3::date`,
                [String(typingTestId), req.user.id, today]
            );

            if (testResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Today's typing test was not found."
                });
            }

            const test = testResult.rows[0];

            const wpm = Number(test.wpm);
            const accuracy = Number(test.accuracy);
            const duration = Number(test.duration_seconds);

            const meetsRequirements =
                wpm >= challenge.wpm &&
                accuracy >= challenge.accuracy &&
                duration >= challenge.duration;

            if (!meetsRequirements) {
                return res.status(400).json({
                    success: false,
                    message: "Challenge targets were not reached.",
                    required: {
                        wpm: challenge.wpm,
                        accuracy: challenge.accuracy,
                        duration: challenge.duration
                    },
                    achieved: {
                        wpm,
                        accuracy,
                        duration
                    }
                });
            }

            const result = await pool.query(
                `INSERT INTO daily_challenge_completions
                    (
                        user_id,
                        challenge_date,
                        challenge_title,
                        wpm,
                        accuracy,
                        duration_seconds,
                        points
                    )
                 VALUES ($1, $2::date, $3, $4, $5, $6, $7)
                 ON CONFLICT (user_id, challenge_date) DO NOTHING
                 RETURNING id, challenge_date, challenge_title,
                           points, completed_at`,
                [
                    req.user.id,
                    today,
                    challenge.title,
                    wpm,
                    accuracy,
                    duration,
                    challenge.points
                ]
            );

            if (result.rows.length === 0) {
                return res.status(409).json({
                    success: false,
                    message: "Today's challenge has already been claimed."
                });
            }

            res.status(201).json({
                success: true,
                message: "Daily challenge completed!",
                completion: result.rows[0],
                pointsAwarded: challenge.points
            });

        } catch (error) {
            console.error("Challenge completion error:", error.message);

            res.status(500).json({
                success: false,
                message: "Could not complete the daily challenge."
            });
        }
    }
);

// =====================================
// Handle Unknown API Routes
// =====================================

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// =====================================
// Frontend Fallback
// =====================================

app.use((req, res, next) => {
    if (req.method !== "GET") {
        return next();
    }

    if (path.extname(req.path)) {
        return res.status(404).send("File not found.");
    }

    res.sendFile(
        path.join(FRONTEND_DIR, "index.html"),
        error => {
            if (error) next(error);
        }
    );
});

// =====================================
// Error Handler
// =====================================

app.use((error, req, res, next) => {
    console.error("Server error:", error.message);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: "An unexpected server error occurred."
    });
});

// =====================================
// Start Server
// =====================================

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`TypeMaster running on port ${PORT}`);
            console.log("Frontend and backend are served together.");
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        await pool.end();
        process.exit(1);
    }
}

startServer();
