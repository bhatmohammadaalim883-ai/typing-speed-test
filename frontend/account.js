
// ======================================
// TYPEMASTER ACCOUNT SYSTEM
// ======================================

// Your deployed backend URL
const API_URL = "https://typing-speed-test-26ct.onrender.com";

// HTML elements
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const profileSection = document.getElementById("profileSection");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const loginSubmit = document.getElementById("loginSubmit");
const registerSubmit = document.getElementById("registerSubmit");

const logoutButton = document.getElementById("logoutButton");


// ======================================
// SWITCH BETWEEN LOGIN AND REGISTER
// ======================================

function showLoginForm() {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    clearMessages();
}

function showRegisterForm() {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    clearMessages();
}

loginTab.addEventListener("click", showLoginForm);
registerTab.addEventListener("click", showRegisterForm);

showRegister.addEventListener("click", showRegisterForm);
showLogin.addEventListener("click", showLoginForm);


// ======================================
// MESSAGE HANDLING
// ======================================

function clearMessages() {
    loginMessage.textContent = "";
    registerMessage.textContent = "";

    loginMessage.className = "form-message";
    registerMessage.className = "form-message";
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `form-message ${type}`;
}


// ======================================
// PASSWORD VISIBILITY
// ======================================

document.querySelectorAll(".password-toggle").forEach(button => {

    button.addEventListener("click", () => {

        const input = document.getElementById(button.dataset.target);

        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            button.textContent = "Hide";
        } else {
            input.type = "password";
            button.textContent = "Show";
        }

    });

});


// ======================================
// REGISTER NEW USER
// ======================================

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessages();

    const username = document
        .getElementById("registerUsername")
        .value.trim();

    const email = document
        .getElementById("registerEmail")
        .value.trim();

    const password = document
        .getElementById("registerPassword")
        .value;

    if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
        showMessage(
            registerMessage,
            "Username must contain 3-20 letters, numbers or underscores.",
            "error"
        );
        return;
    }

    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
        showMessage(
            registerMessage,
            "Password must contain 8-72 bytes.",
            "error"
        );
        return;
    }

    registerSubmit.disabled = true;
    registerSubmit.textContent = "Creating Account...";

    try {

        const response = await fetch(`${API_URL}/api/auth/register`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                email,
                password
            })

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed.");
        }

        showMessage(
            registerMessage,
            "Account created successfully! You can now log in.",
            "success"
        );

        registerForm.reset();

        setTimeout(() => {
            showLoginForm();

            document.getElementById("loginEmail").value = email;

        }, 1200);

    } catch (error) {

        showMessage(
            registerMessage,
            error.message || "Unable to connect to the server.",
            "error"
        );

    } finally {

        registerSubmit.disabled = false;
        registerSubmit.textContent = "Create Account";

    }

});


// ======================================
// LOGIN EXISTING USER
// ======================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessages();

    const email = document
        .getElementById("loginEmail")
        .value.trim();

    const password = document
        .getElementById("loginPassword")
        .value;

    loginSubmit.disabled = true;
    loginSubmit.textContent = "Logging In...";

    try {

        const response = await fetch(`${API_URL}/api/auth/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        if (!data.token) {
            throw new Error("The server did not return an authentication token.");
        }

        // Store token for this browser tab session
        sessionStorage.setItem("typemaster_token", data.token);

        loginForm.reset();

        await loadUserProfile();

    } catch (error) {

        showMessage(
            loginMessage,
            error.message || "Unable to connect to the server.",
            "error"
        );

    } finally {

        loginSubmit.disabled = false;
        loginSubmit.textContent = "Log In";

    }

});


// ======================================
// LOAD USER PROFILE
// ======================================

async function loadUserProfile() {

    const token = sessionStorage.getItem("typemaster_token");

    if (!token) return;

    try {

        const response = await fetch(`${API_URL}/api/auth/me`, {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });

        const data = await response.json();

        if (!response.ok) {
            sessionStorage.removeItem("typemaster_token");

            if (response.status === 401) {
                showLoginForm();

                showMessage(
                    loginMessage,
                    "Your session has expired. Please log in again.",
                    "error"
                );

                return;
            }

            throw new Error(data.message || "Unable to load profile.");
        }

        displayUserProfile(data.user);

    } catch (error) {

        console.error("Profile loading failed:", error.message);

        showLoginForm();

        showMessage(
            loginMessage,
            "Unable to load your profile. Please try again.",
            "error"
        );

    }

}


// ======================================
// DISPLAY USER PROFILE
// ======================================

function displayUserProfile(user) {

    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");

    document.querySelector(".account-tabs").classList.add("hidden");

    profileSection.classList.remove("hidden");

    document.getElementById("profileUsername").textContent =
        `Username: ${user.username}`;

    document.getElementById("profileEmail").textContent =
        `Email: ${user.email}`;

    document.getElementById("profileAvatar").textContent =
        user.username.charAt(0).toUpperCase();

}


// ======================================
// LOGOUT
// ======================================

logoutButton.addEventListener("click", () => {

    sessionStorage.removeItem("typemaster_token");

    profileSection.classList.add("hidden");

    document.querySelector(".account-tabs").classList.remove("hidden");

    loginForm.reset();
    registerForm.reset();

    showLoginForm();

    showMessage(
        loginMessage,
        "You have successfully logged out.",
        "success"
    );

});


// ======================================
// CHECK EXISTING LOGIN SESSION
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    loadUserProfile();

});
