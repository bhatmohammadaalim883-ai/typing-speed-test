
document.addEventListener("DOMContentLoaded", () => {
    const coachForm = document.getElementById("coachForm");

    coachForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const wpm = Number(document.getElementById("wpm").value);
        const accuracy = Number(document.getElementById("accuracy").value);
        const duration = Number(document.getElementById("duration").value);

        if (
            !Number.isFinite(wpm) ||
            !Number.isFinite(accuracy) ||
            wpm <= 0 ||
            wpm > 1000 ||
            accuracy < 0 ||
            accuracy > 100
        ) {
            alert("Please enter valid typing results.");
            return;
        }

        analysePerformance(wpm, accuracy, duration);
    });
});

function analysePerformance(wpm, accuracy, duration) {
    const results = document.getElementById("coachResults");
    const overview = document.getElementById("overview");
    const suggestions = document.getElementById("suggestions");
    const practiceGoal = document.getElementById("practiceGoal");

    document.getElementById("resultWpm").textContent = wpm.toFixed(1);
    document.getElementById("resultAccuracy").textContent =
        accuracy.toFixed(1) + "%";

    // Performance overview
    let performanceMessage = "";

    if (accuracy >= 98 && wpm >= 60) {
        performanceMessage =
            "Excellent performance! You have achieved strong speed and accuracy.";
    } else if (accuracy >= 95 && wpm >= 40) {
        performanceMessage =
            "Great work! Your typing performance is developing well.";
    } else if (accuracy >= 90) {
        performanceMessage =
            "Good accuracy! Focus on gradually improving your typing speed.";
    } else if (accuracy >= 80) {
        performanceMessage =
            "You have a good starting point. Work on reducing typing mistakes.";
    } else {
        performanceMessage =
            "Your main focus should be accuracy. Slow down and practise carefully.";
    }

    overview.textContent = performanceMessage;

    // Personalised suggestions
    const tips = [];

    if (accuracy < 95) {
        tips.push("Focus on accuracy before trying to type faster.");
        tips.push("Practise difficult words and commonly mistyped letters.");
    } else {
        tips.push("Maintain your accuracy while gradually increasing speed.");
    }

    if (wpm < 30) {
        tips.push("Start with short, simple passages and practise regularly.");
    } else if (wpm < 50) {
        tips.push("Try longer passages to improve your typing rhythm.");
    } else if (wpm < 80) {
        tips.push("Practise challenging passages to develop consistency.");
    } else {
        tips.push("Challenge yourself with longer and more varied passages.");
    }

    if (duration <= 30) {
        tips.push("Try a longer typing test to check your consistency.");
    }

    if (accuracy >= 98) {
        tips.push("Your next goal can be a small speed improvement.");
    }

    suggestions.replaceChildren();

    tips.forEach((tip) => {
        const item = document.createElement("li");
        item.textContent = tip;
        suggestions.appendChild(item);
    });

    // Next practice goal
    const targetWpm = Math.ceil(wpm + Math.max(2, wpm * 0.05));

    if (accuracy < 95) {
        practiceGoal.textContent =
            "Complete a short practice session while aiming for at least 95% accuracy. Your next speed target is " +
            targetWpm + " WPM.";
    } else {
        practiceGoal.textContent =
            "Aim for " + targetWpm +
            " WPM while maintaining at least " +
            accuracy.toFixed(1) + "% accuracy.";
    }

    results.hidden = false;
    results.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
