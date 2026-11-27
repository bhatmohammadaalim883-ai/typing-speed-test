
// ======================================
// TYPEMASTER DASHBOARD
// ======================================

// Use the same domain for frontend and backend
const API_URL = "";

// ======================================
// INITIALIZE DASHBOARD
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    loadDashboard();

});

// ======================================
// LOAD DASHBOARD
// ======================================

async function loadDashboard() {

    const token = sessionStorage.getItem("typemaster_token");

    if (!token) {
        window.location.href = "account.html";
        return;
    }

    try {

        // Get logged-in user
        const userResponse = await fetch(`${API_URL}/api/auth/me`, {

            headers: {
                Authorization: `Bearer ${token}`
            }

        });

        if (userResponse.status === 401) {
            logout();
            return;
        }

        const userData = await userResponse.json();

        if (!userResponse.ok || !userData.success) {
            throw new Error("Could not load user profile.");
        }

        displayUser(userData.user);

        // Get typing statistics
        await loadTypingStatistics(token);

    } catch (error) {

        console.error("Dashboard error:", error);

        showActivityMessage(
            "Could not load your dashboard. Please refresh."
        );

    }

}

// ======================================
// DISPLAY USER INFORMATION
// ======================================

function displayUser(user) {

    const username = user.username || "User";

    document.getElementById("username").textContent = username;

    document.getElementById("welcomeName").textContent = username;

    document.getElementById("userAvatar").textContent =
        username.charAt(0).toUpperCase();

}

// ======================================
// LOAD TYPING STATISTICS
// ======================================

async function loadTypingStatistics(token) {

    try {

        const response = await fetch(
            `${API_URL}/api/typing-tests/stats`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Could not retrieve typing statistics.");
        }

        displayStatistics(data.stats);

        displayRecentActivity(data.recentTests);

    } catch (error) {

        console.error("Statistics error:", error);

        showActivityMessage(
            "Typing statistics are temporarily unavailable."
        );

    }

}

// ======================================
// DISPLAY STATISTICS
// ======================================

function displayStatistics(stats) {

    const totalTests = Number(stats.total_tests) || 0;

    const averageWpm = Number(stats.average_wpm) || 0;

    const averageAccuracy = Number(stats.average_accuracy) || 0;

    document.getElementById("totalTests").textContent = totalTests;

    document.getElementById("averageWpm").textContent =
        averageWpm.toFixed(1);

    document.getElementById("averageAccuracy").textContent =
        averageAccuracy.toFixed(1) + "%";

    document.getElementById("membership").textContent = "Free";

}

// ======================================
// DISPLAY RECENT ACTIVITY
// ======================================

function displayRecentActivity(tests) {

    const activityContainer =
        document.getElementById("recentActivity");

    activityContainer.replaceChildren();

    if (!Array.isArray(tests) || tests.length === 0) {

        showActivityMessage("No typing tests completed yet.");

        return;
    }

    tests.forEach((test) => {

        const item = document.createElement("div");

        item.className = "activity-item";

        const details = document.createElement("div");

        details.className = "activity-details";

        const title = document.createElement("h3");

        title.textContent = `${test.language} Typing Test`;

        const date = document.createElement("p");

        const parsedDate = new Date(test.created_at);

        date.textContent = Number.isNaN(parsedDate.getTime())
            ? "Date unavailable"
            : parsedDate.toLocaleString("en-IN");

        const score = document.createElement("div");

        score.className = "activity-score";

        const wpm = document.createElement("span");

        wpm.textContent = `${Number(test.wpm).toFixed(1)} WPM`;

        const accuracy = document.createElement("span");

        accuracy.textContent =
            `${Number(test.accuracy).toFixed(1)}% Accuracy`;

        details.append(title, date);

        score.append(wpm, accuracy);

        item.append(details, score);

        activityContainer.appendChild(item);

    });

}

// ======================================
// ACTIVITY MESSAGE
// ======================================

function showActivityMessage(message) {

    const container = document.getElementById("recentActivity");

    if (!container) return;

    const paragraph = document.createElement("p");

    paragraph.textContent = message;

    container.replaceChildren(paragraph);

}

// ======================================
// LOGOUT
// ======================================

function logout() {

    sessionStorage.removeItem("typemaster_token");

    window.location.href = "account.html";

}

console.log("TypeMaster dashboard initialized successfully!");
