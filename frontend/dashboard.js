
const API_URL = "https://typing-speed-test-26ct.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
});

async function loadDashboard() {
    const token = sessionStorage.getItem("typemaster_token");

    // Check login status
    if (!token) {
        window.location.href = "account.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Session expired");
        }

        displayUser(data.user);

    } catch (error) {
        console.error("Dashboard error:", error);

        sessionStorage.removeItem("typemaster_token");
        window.location.href = "account.html";
    }
}

// Display user information
function displayUser(user) {
    const username = user.username || "User";

    document.getElementById("username").textContent = username;

    document.getElementById("welcomeName").textContent = username;

    document.getElementById("userAvatar").textContent =
        username.charAt(0).toUpperCase();
}

// Logout
function logout() {
    sessionStorage.removeItem("typemaster_token");
    window.location.href = "account.html";
}
