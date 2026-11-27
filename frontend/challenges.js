
document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "https://typing-speed-test-26ct.onrender.com";

    const startButton = document.getElementById("startChallengeBtn");
    const challengeTitle = document.getElementById("challengeTitle");
    const challengeDescription = document.getElementById("challengeDescription");
    const challengePoints = document.getElementById("challengePoints");
    const targetWpm = document.getElementById("targetWpm");
    const targetAccuracy = document.getElementById("targetAccuracy");
    const targetDuration = document.getElementById("targetDuration");
    const challengeStatus = document.getElementById("challengeStatus");

    const completedCount = document.getElementById("completedCount");
    const totalPoints = document.getElementById("totalPoints");
    const currentStreak = document.getElementById("currentStreak");
    const historyList = document.getElementById("historyList");

    const token = sessionStorage.getItem("typemaster_token");

    let todayChallenge = null;
    let challengeDate = null;

    if (!token) {
        showLoginMessage();
        return;
    }

    startButton.disabled = true;
    startButton.textContent = "Loading Challenge...";

    try {
        const response = await fetch(`${API_URL}/api/challenges/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load challenges.");
        }

        todayChallenge = data.challenge;
        challengeDate =
            todayChallenge.date ||
            todayChallenge.challenge_date ||
            getIndiaDateKey();

        if (!todayChallenge) {
            throw new Error("Today's challenge was not returned by the server.");
        }

        displayChallenge(todayChallenge, data);
        updateOverview(data);
        displayHistory(data.history || []);

    } catch (error) {
        console.error("Challenge loading error:", error);

        challengeStatus.textContent =
            "Unable to load your challenge. Please refresh the page.";

        startButton.disabled = true;
        startButton.textContent = "Challenge Unavailable";
    }

    startButton.addEventListener("click", () => {
        if (!todayChallenge || !challengeDate) return;

        const params = new URLSearchParams({
            mode: "challenge",
            date: challengeDate,
            wpm: todayChallenge.wpm,
            accuracy: todayChallenge.accuracy,
            duration: todayChallenge.duration
        });

        window.location.href =
            "typing-test.html?" + params.toString();
    });

    function displayChallenge(challenge, data) {
        challengeTitle.textContent = challenge.title;
        challengeDescription.textContent = challenge.description;
        challengePoints.textContent = "+" + challenge.points + " Points";

        targetWpm.textContent = challenge.wpm + " WPM";
        targetAccuracy.textContent = challenge.accuracy + "%";
        targetDuration.textContent =
            challenge.duration + " Seconds";

        const completed =
            data.completed === true ||
            data.completedToday === true ||
            data.isCompleted === true;

        if (completed) {
            startButton.disabled = true;
            startButton.textContent = "Challenge Completed";

            challengeStatus.textContent =
                "You have completed today's challenge!";
        } else {
            startButton.disabled = false;
            startButton.textContent = "Start Challenge";

            challengeStatus.textContent =
                "Complete today's typing challenge to earn points.";
        }
    }

    function updateOverview(data) {
        completedCount.textContent =
            data.completedCount ??
            data.completed_count ??
            (Array.isArray(data.history) ? data.history.length : 0);

        totalPoints.textContent =
            data.totalPoints ?? data.total_points ?? 0;

        currentStreak.textContent =
            (data.streak ?? data.currentStreak ?? 0) + " days";
    }

    function displayHistory(history) {
        historyList.replaceChildren();

        if (!Array.isArray(history) || history.length === 0) {
            const message = document.createElement("p");
            message.textContent = "No challenges completed yet.";
            historyList.appendChild(message);
            return;
        }

        history.forEach(item => {
            const row = document.createElement("div");
            row.className = "challenge-history-item";

            const title = document.createElement("strong");
            title.textContent =
                (item.title || item.challenge_title || "Daily Challenge") +
                " — " +
                (item.date || item.challenge_date || "");

            const points = document.createElement("span");
            points.textContent =
                "+" + (item.points || 0) + " points";

            row.append(title, points);
            historyList.appendChild(row);
        });
    }

    function showLoginMessage() {
        challengeTitle.textContent = "Login Required";
        challengeDescription.textContent =
            "Please log in to access daily challenges and save your progress.";

        challengeStatus.textContent =
            "Your challenge progress is connected to your account.";

        startButton.disabled = true;
        startButton.textContent = "Login to Continue";

        startButton.addEventListener("click", () => {
            window.location.href = "account.html";
        });

        completedCount.textContent = "0";
        totalPoints.textContent = "0";
        currentStreak.textContent = "0 days";

        historyList.replaceChildren();

        const message = document.createElement("p");
        message.textContent = "Log in to view your challenge history.";
        historyList.appendChild(message);
    }

    function getIndiaDateKey() {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());
    }
});
