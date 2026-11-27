
const practiceExercises = {
    sentences: {
        title: "Sentence Practice",
        text: "Practice every day to improve your typing speed."
    },
    numbers: {
        title: "Number Practice",
        text: "1234567890 9876543210 202620272028"
    },
    symbols: {
        title: "Symbol Practice",
        text: "! @ # $ % ^ & * ( ) _ + = { } [ ]"
    },
    difficult: {
        title: "Difficult Words",
        text: "Entrepreneurship responsibility communication extraordinary development"
    },
    custom: {
        title: "Custom Text",
        text: "Welcome to TypeMaster. Start practising today."
    }
};

const practiceTitle = document.getElementById("practiceTitle");
const practiceText = document.getElementById("practiceText");
const practiceInput = document.getElementById("practiceInput");
const practiceWpm = document.getElementById("practiceWpm");
const practiceAccuracy = document.getElementById("practiceAccuracy");
const practiceErrors = document.getElementById("practiceErrors");
const practiceReset = document.getElementById("practiceReset");

let currentPractice = "sentences";
let practiceStartedAt = null;

function loadPractice(type) {
    if (!practiceExercises[type]) return;

    currentPractice = type;

    practiceTitle.textContent = practiceExercises[type].title;
    practiceText.textContent = practiceExercises[type].text;

    resetPractice();
}

function resetPractice() {
    practiceInput.value = "";
    practiceWpm.textContent = "0";
    practiceAccuracy.textContent = "100%";
    practiceErrors.textContent = "0";

    practiceStartedAt = null;
    practiceInput.focus();
}

// Select practice exercise
document.querySelectorAll("[data-practice]").forEach(button => {
    button.addEventListener("click", () => {
        loadPractice(button.dataset.practice);
    });
});

// Restart practice
practiceReset.addEventListener("click", resetPractice);

// Calculate typing statistics
practiceInput.addEventListener("input", () => {
    const targetText = practiceExercises[currentPractice].text;
    const typedText = practiceInput.value;

    if (typedText.length > 0 && practiceStartedAt === null) {
        practiceStartedAt = Date.now();
    }

    let correct = 0;
    let errors = 0;

    for (let i = 0; i < typedText.length; i++) {
        if (typedText[i] === targetText[i]) {
            correct++;
        } else {
            errors++;
        }
    }

    const totalTyped = typedText.length;

    let accuracy = totalTyped > 0
        ? Math.round((correct / totalTyped) * 100)
        : 100;

    let wpm = 0;

    if (practiceStartedAt !== null) {
        const elapsedSeconds = (Date.now() - practiceStartedAt) / 1000;

        if (elapsedSeconds > 0) {
            wpm = Math.round((correct / 5) / (elapsedSeconds / 60));
        }
    }

    practiceWpm.textContent = wpm;
    practiceAccuracy.textContent = accuracy + "%";
    practiceErrors.textContent = errors;
});

// Load default exercise
loadPractice("sentences");

console.log("TypeMaster Practice Zone loaded successfully.");
