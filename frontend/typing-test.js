
// ======================================
// TYPEMASTER TYPING TEST SYSTEM
// ======================================

const API_URL = "";

// ======================================
// AUTHENTICATION STORAGE
// ======================================

function getAuthToken() {
    const token =
        localStorage.getItem("typemaster_token") ||
        sessionStorage.getItem("typemaster_token");

    if (token) {
        localStorage.setItem("typemaster_token", token);
    }

    return token;
}

function clearAuthToken() {
    localStorage.removeItem("typemaster_token");
    sessionStorage.removeItem("typemaster_token");
}

// ======================================
// 1. CHALLENGE MODE CONFIGURATION
// ======================================

const urlParams = new URLSearchParams(window.location.search);

const isChallengeMode = urlParams.get("mode") === "challenge";

const requestedChallengeDuration = Number(
    urlParams.get("duration")
);

const challengeDuration = [60, 120].includes(requestedChallengeDuration)
    ? requestedChallengeDuration
    : 60;

// ======================================
// 2. TYPING PASSAGES
// ======================================

const passages = {
    English: {
        easy: "Practice makes progress. Good typing takes time.",
        medium: "The quick brown fox jumps over the lazy dog. Regular practice improves typing speed and accuracy.",
        hard: "Technology continues to transform communication, education, productivity and the way people interact with information."
    },

    Hindi: {
        easy: "अभ्यास से सफलता मिलती है।",
        medium: "नियमित अभ्यास करने से हमारी गति और सटीकता में सुधार होता है।",
        hard: "तकनीक ने शिक्षा, संचार और हमारे दैनिक जीवन में महत्वपूर्ण परिवर्तन किए हैं।"
    },

    Urdu: {
        easy: "محنت کامیابی کی کنجی ہے۔",
        medium: "مسلسل مشق سے ہماری رفتار اور درستگی میں بہتری آتی ہے۔",
        hard: "ٹیکنالوجی نے تعلیم، مواصلات اور روزمرہ زندگی میں اہم تبدیلیاں پیدا کی ہیں۔"
    }
};

// ======================================
// 3. HTML ELEMENTS
// ======================================

const elements = {
    mode: document.getElementById("testMode"),
    duration: document.getElementById("duration"),
    difficulty: document.getElementById("difficulty"),
    language: document.getElementById("language"),
    timer: document.getElementById("timer"),
    wpm: document.getElementById("wpm"),
    accuracy: document.getElementById("accuracy"),
    errors: document.getElementById("errors"),
    display: document.getElementById("textDisplay"),
    input: document.getElementById("typingInput"),
    start: document.getElementById("startBtn"),
    reset: document.getElementById("resetBtn"),
    message: document.getElementById("resultMessage")
};

// ======================================
// 4. TEST VARIABLES
// ======================================

let passage = "";
let timeLeft = 60;
let elapsedSeconds = 0;
let interval = null;
let startedAt = null;
let running = false;
let completed = false;

// ======================================
// 5. WORD PASSAGE GENERATOR
// ======================================

function makeWordPassage(count) {

    const easy = [
        "apple",
        "school",
        "happy",
        "water",
        "music"
    ];

    const medium = [
        "computer",
        "keyboard",
        "practice",
        "language",
        "success"
    ];

    const hard = [
        "entrepreneurship",
        "communication",
        "extraordinary",
        "development"
    ];

    const words = {
        easy,
        medium,
        hard
    }[elements.difficulty.value];

    return Array.from(
        { length: count },
        (_, i) => words[i % words.length]
    ).join(" ");
}

// ======================================
// 6. CODE PASSAGE GENERATOR
// ======================================

function makeCodePassage() {
    return "const message = 'Hello TypeMaster';\nconsole.log(message);";
}

// ======================================
// 7. CHALLENGE PASSAGE GENERATOR
// ======================================

function makeChallengePassage() {

    const language = elements.language.value;
    const difficulty = elements.difficulty.value;

    const basePassage =
        passages[language]?.[difficulty] ||
        passages.English.hard;

    return Array(40)
        .fill(basePassage)
        .join(" ");

}

// ======================================
// 8. GET TYPING PASSAGE
// ======================================

function getPassage() {

    if (isChallengeMode) {
        return makeChallengePassage();
    }

    const mode = elements.mode.value;
    const language = elements.language.value;
    const difficulty = elements.difficulty.value;

    if (mode === "code") {
        return makeCodePassage();
    }

    if (mode === "words") {
        return makeWordPassage(50);
    }

    return passages[language][difficulty];

}

// ======================================
// 9. RENDER PASSAGE
// ======================================

function renderPassage(typed = "") {

    elements.display.replaceChildren();

    for (let i = 0; i < passage.length; i++) {

        const span = document.createElement("span");

        span.textContent = passage[i];

        if (i < typed.length) {

            span.className =
                typed[i] === passage[i]
                    ? "correct"
                    : "incorrect";

        }

        elements.display.appendChild(span);

    }

}

// ======================================
// 10. CALCULATE TYPING STATISTICS
// ======================================

function calculateStats(text, seconds) {

    let correct = 0;
    let errors = 0;

    for (let i = 0; i < text.length; i++) {

        if (text[i] === passage[i]) {
            correct++;
        } else {
            errors++;
        }

    }

    const minutes = Math.max(seconds, 1) / 60;

    const wpm = Math.round((correct / 5) / minutes);

    const accuracy = text.length
        ? Math.round((correct / text.length) * 100)
        : 100;

    return {
        wpm,
        accuracy,
        errors
    };

}

// ======================================
// 11. UPDATE TYPING STATISTICS
// ======================================

function updateStats() {

    const stats = calculateStats(
        elements.input.value,
        elapsedSeconds
    );

    elements.wpm.textContent = stats.wpm;

    elements.accuracy.textContent =
        stats.accuracy + "%";

    elements.errors.textContent = stats.errors;

    renderPassage(elements.input.value);

    return stats;

}

// ======================================
// 12. RESET TYPING TEST
// ======================================

function resetTest() {

    clearInterval(interval);

    running = false;
    completed = false;

    timeLeft = Number(elements.duration.value);

    elapsedSeconds = 0;
    startedAt = null;

    passage = getPassage();

    elements.timer.textContent = timeLeft;

    elements.input.value = "";
    elements.input.disabled = true;

    elements.start.disabled = false;

    elements.message.textContent = "";

    elements.wpm.textContent = "0";
    elements.accuracy.textContent = "100%";
    elements.errors.textContent = "0";

    renderPassage();

}

// ======================================
// 13. SAVE RESULT TO DATABASE
// ======================================

async function saveResult(stats) {

    const token = getAuthToken();

    if (!token) {

        return {
            success: false,
            message: "Log in to save this result to your account.",
            testId: null
        };

    }

    try {

        const response = await fetch(
            `${API_URL}/api/typing-tests`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    wpm: stats.wpm,
                    accuracy: stats.accuracy,
                    duration_seconds: elapsedSeconds,
                    language: elements.language.value
                })
            }
        );

        const data = await response.json();

        if (response.status === 401) {

            clearAuthToken();

            return {
                success: false,
                message: "Your login session expired. Please log in again.",
                testId: null
            };

        }

        if (!response.ok || !data.success) {

            return {
                success: false,
                message: data.message ||
                    "Could not save your result.",
                testId: null
            };

        }

        return {
            success: true,
            message: "Your typing result was saved successfully!",
            testId: data.test?.id || null
        };

    } catch (error) {

        console.error("Save error:", error);

        return {
            success: false,
            message: "Could not connect to the server. Please try again.",
            testId: null
        };

    }

}

// ======================================
// 14. COMPLETE DAILY CHALLENGE
// ======================================

async function completeDailyChallenge(testId) {

    const token = getAuthToken();

    if (!token || !testId) {

        return {
            success: false,
            message: "Your test was saved, but challenge completion could not be submitted."
        };

    }

    try {

        const response = await fetch(
            `${API_URL}/api/challenges/complete`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    typing_test_id: testId
                })
            }
        );

        const data = await response.json();

        if (response.status === 401) {

            clearAuthToken();

            return {
                success: false,
                message: "Your login session expired. Please log in again."
            };

        }

        if (!response.ok || !data.success) {

            return {
                success: false,
                message: data.message ||
                    "Challenge completion could not be verified."
            };

        }

        return {
            success: true,
            message:
                `Daily challenge completed! You earned ${data.pointsAwarded} points!`
        };

    } catch (error) {

        console.error("Challenge completion error:", error);

        return {
            success: false,
            message: "Your typing result was saved, but the challenge could not be submitted. Please check your connection."
        };

    }

}

// ======================================
// 15. FINISH TYPING TEST
// ======================================

async function finishTest() {

    if (!running || completed) return;

    running = false;
    completed = true;

    clearInterval(interval);

    elapsedSeconds = startedAt
        ? Math.max(
            1,
            Math.round((Date.now() - startedAt) / 1000)
        )
        : 1;

    elements.input.disabled = true;
    elements.start.disabled = false;

    const stats = updateStats();

    if (!elements.input.value.trim()) {

        elements.message.textContent =
            "Test finished. No result was saved because nothing was typed.";

        return;

    }

    elements.message.textContent = "Saving your result...";

    const saveResponse = await saveResult(stats);

    if (!saveResponse.success) {

        elements.message.textContent =
            saveResponse.message;

        return;

    }

    if (!isChallengeMode) {

        elements.message.textContent =
            saveResponse.message;

        return;

    }

    if (!saveResponse.testId) {

        elements.message.textContent =
            "Your result was saved, but no test ID was returned. Challenge completion could not be verified.";

        return;

    }

    elements.message.textContent =
        "Checking your daily challenge...";

    const challengeResponse =
        await completeDailyChallenge(
            saveResponse.testId
        );

    if (challengeResponse.success) {

        elements.message.textContent =
            challengeResponse.message;

    } else {

        elements.message.textContent =
            `Typing result saved. ${challengeResponse.message}`;

    }

}

// ======================================
// 16. START TYPING TEST
// ======================================

function startTest() {

    if (running) return;

    resetTest();

    running = true;

    elements.input.disabled = false;

    elements.input.focus();

    elements.start.disabled = true;

    startedAt = Date.now();

    interval = setInterval(() => {

        if (!running) return;

        elapsedSeconds = Math.floor(
            (Date.now() - startedAt) / 1000
        );

        timeLeft = Math.max(
            0,
            Number(elements.duration.value) - elapsedSeconds
        );

        elements.timer.textContent = timeLeft;

        updateStats();

        if (timeLeft <= 0) {
            finishTest();
        }

    }, 250);

}

// ======================================
// 17. TEST BUTTON EVENTS
// ======================================

elements.start.addEventListener(
    "click",
    startTest
);

elements.reset.addEventListener(
    "click",
    resetTest
);

// ======================================
// 18. TYPING INPUT EVENT
// ======================================

elements.input.addEventListener("input", () => {

    if (!running) return;

    updateStats();

    if (
        !isChallengeMode &&
        elements.input.value.length >= passage.length
    ) {

        finishTest();

    }

});

// ======================================
// 19. TEST SETTINGS EVENTS
// ======================================

[
    elements.mode,
    elements.duration,
    elements.difficulty,
    elements.language
].forEach(element => {

    element.addEventListener(
        "change",
        resetTest
    );

});

// ======================================
// 20. CHALLENGE MODE INITIALIZATION
// ======================================

if (isChallengeMode) {

    const durationOptionExists = Array.from(
        elements.duration.options
    ).some(option =>
        Number(option.value) === challengeDuration
    );

    if (!durationOptionExists) {

        const option = document.createElement("option");

        option.value = String(challengeDuration);

        option.textContent =
            `${challengeDuration} Seconds`;

        elements.duration.appendChild(option);

    }

    elements.duration.value =
        String(challengeDuration);

    elements.duration.disabled = true;
    elements.mode.disabled = true;

    console.log(
        `TypeMaster challenge mode enabled: ${challengeDuration} seconds`
    );

}

// ======================================
// 21. INITIALIZE TYPEMASTER
// ======================================

resetTest();

console.log(
    "TypeMaster typing test initialized successfully!"
);
