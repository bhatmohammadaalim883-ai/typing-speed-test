
document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startChallengeBtn");

    const challenges = [
        {
            title: "Accuracy Master",
            description: "Complete a typing test with excellent accuracy.",
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

    const today = getLocalDateKey(new Date());
    const challengeIndex = getDayNumber(today) % challenges.length;
    const todayChallenge = challenges[challengeIndex];

    let progress = loadProgress();

    displayChallenge(todayChallenge);
    updateOverview();
    displayHistory();

    startButton.addEventListener("click", () => {
        const params = new URLSearchParams({
            mode: "challenge",
            date: today,
            wpm: todayChallenge.wpm,
            accuracy: todayChallenge.accuracy,
            duration: todayChallenge.duration
        });

        window.location.href = "typing-test.html?" + params.toString();
    });

    function displayChallenge(challenge) {
        document.getElementById("challengeTitle").textContent =
            challenge.title;

        document.getElementById("challengeDescription").textContent =
            challenge.description;

        document.getElementById("challengePoints").textContent =
            "+" + challenge.points + " Points";

        document.getElementById("targetWpm").textContent =
            challenge.wpm + " WPM";

        document.getElementById("targetAccuracy").textContent =
            challenge.accuracy + "%";

        document.getElementById("targetDuration").textContent =
            challenge.duration + " Seconds";

        const completed = progress.completedDates.includes(today);

        if (completed) {
            startButton.disabled = true;
            startButton.textContent = "Challenge Completed";
            document.getElementById("challengeStatus").textContent =
                "You have completed today's challenge!";
        }
    }

    function updateOverview() {
        document.getElementById("completedCount").textContent =
            progress.completedDates.length;

        document.getElementById("totalPoints").textContent =
            progress.totalPoints;

        document.getElementById("currentStreak").textContent =
            calculateStreak(progress.completedDates) + " days";
    }

    function displayHistory() {
        const historyList = document.getElementById("historyList");
        historyList.replaceChildren();

        if (progress.history.length === 0) {
            const message = document.createElement("p");
            message.textContent = "No challenges completed yet.";
            historyList.appendChild(message);
            return;
        }

        progress.history.forEach(item => {
            const row = document.createElement("div");
            row.className = "challenge-history-item";

            const title = document.createElement("strong");
            title.textContent = item.title + " — " + item.date;

            const points = document.createElement("span");
            points.textContent = "+" + item.points + " points";

            row.append(title, points);
            historyList.appendChild(row);
        });
    }

    function loadProgress() {
        try {
            const saved = JSON.parse(
                localStorage.getItem("typemaster_challenge_progress")
            );

            if (
                saved &&
                Array.isArray(saved.completedDates) &&
                Array.isArray(saved.history) &&
                Number.isFinite(saved.totalPoints)
            ) {
                return saved;
            }
        } catch (error) {
            console.warn("Could not load challenge progress:", error);
        }

        return {
            completedDates: [],
            totalPoints: 0,
            history: []
        };
    }

    function getLocalDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function getDayNumber(dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        return Math.floor(
            Date.UTC(year, month - 1, day) / 86400000
        );
    }

    function calculateStreak(completedDates) {
        const completed = new Set(completedDates);
        const todayDate = new Date();

        let streak = 0;
        const todayKey = getLocalDateKey(todayDate);
        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);

        let checkDate = completed.has(todayKey)
            ? todayDate
            : yesterday;

        while (completed.has(getLocalDateKey(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        return streak;
    }
});
