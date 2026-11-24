
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// Start server
app.listen(PORT, () => {
    console.log(`TypeMaster server running on port ${PORT}`);
});
