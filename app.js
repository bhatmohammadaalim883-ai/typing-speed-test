
// =============================================
// TYPEMASTER - TYPING SPEED TEST PLATFORM
// =============================================


// =============================================
// 1. SELECT HTML ELEMENTS
// =============================================

// Typing Test Elements

const timerElement = document.getElementById("timer");
const wpmElement = document.getElementById("wpm");
const accuracyElement = document.getElementById("accuracy");
const errorsElement = document.getElementById("errors");

const textDisplay = document.getElementById("text-display");
const typingInput = document.getElementById("typing-input");

const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");

const timeSelect = document.getElementById("time-select");
const languageSelect = document.getElementById("language-select");

const resultMessage = document.getElementById("result-message");


// Typing Practice Elements

const practiceLevel = document.getElementById("practice-level");
const practiceText = document.getElementById("practice-text");
const practiceInput = document.getElementById("practice-input");

const practiceWpm = document.getElementById("practice-wpm");
const practiceAccuracy = document.getElementById("practice-accuracy");
const practiceErrors = document.getElementById("practice-errors");

const practiceReset = document.getElementById("practice-reset");
const practiceMessage = document.getElementById("practice-message");


// =============================================
// 2. TYPING TEST PASSAGES
// =============================================

const typingTexts = {

    en: "The quick brown fox jumps over the lazy dog. Practice every day to improve your typing speed and accuracy.",

    hi: "अभ्यास करने से हमारी गति और सटीकता में सुधार होता है। नियमित अभ्यास सफलता की कुंजी है।",

    ur: "محنت اور مسلسل مشق سے انسان اپنی صلاحیتوں کو بہتر بنا سکتا ہے۔"

};


// =============================================
// 3. PRACTICE PASSAGES
// =============================================

const practiceTexts = {

    easy: "Learning to type is a useful skill. Practice every day and improve your typing speed.",

    medium: "Technology is changing the world. Computers help people communicate, learn, work and solve problems.",

    hard: "Successful typing requires concentration, consistency, patience and accuracy. Keep practising to improve your performance."

};


// =============================================
// 4. TEST VARIABLES
// =============================================

let timeLeft = Number(timeSelect.value);

let timer = null;

let isRunning = false;

let startTime = null;


// =============================================
// 5. TEST STATISTICS FUNCTION
// =============================================

function calculateStatistics(typedText, originalText, elapsedSeconds) {

    let correctCharacters = 0;

    let errors = 0;

    for (let i = 0; i < typedText.length; i++) {

        if (typedText[i] === originalText[i]) {

            correctCharacters++;

        } else {

            errors++;

        }

    }

    const minutes = elapsedSeconds / 60;

    let wpm = 0;

    if (minutes > 0) {

        wpm = Math.round((correctCharacters / 5) / minutes);

    }

    let accuracy = 100;

    if (typedText.length > 0) {

        accuracy = Math.round(
            (correctCharacters / typedText.length) * 100
        );

    }

    return {
        wpm,
        accuracy,
        errors
    };

}


// =============================================
// 6. UPDATE TEST STATISTICS
// =============================================

function updateStatistics() {

    const typedText = typingInput.value;

    const originalText = textDisplay.textContent;

    const elapsedSeconds = Math.max(
        1,
        (Date.now() - startTime) / 1000
    );

    const stats = calculateStatistics(
        typedText,
        originalText,
        elapsedSeconds
    );

    wpmElement.textContent = stats.wpm;

    accuracyElement.textContent = stats.accuracy + "%";

    errorsElement.textContent = stats.errors;

}


// =============================================
// 7. RESET TYPING TEST
// =============================================

function resetTest() {

    clearInterval(timer);

    isRunning = false;

    timeLeft = Number(timeSelect.value);

    timerElement.textContent = timeLeft;

    wpmElement.textContent = "0";

    accuracyElement.textContent = "100%";

    errorsElement.textContent = "0";

    typingInput.value = "";

    typingInput.disabled = true;

    startButton.disabled = false;

    resultMessage.textContent = "";

    textDisplay.textContent = typingTexts[languageSelect.value];

}


// =============================================
// 8. END TYPING TEST
// =============================================

function endTest() {

    if (!isRunning) return;

    clearInterval(timer);

    isRunning = false;

    typingInput.disabled = true;

    startButton.disabled = false;

    updateStatistics();

    resultMessage.textContent =
        "Test completed! Your typing speed is " +
        wpmElement.textContent +
        " WPM with " +
        accuracyElement.textContent +
        " accuracy.";

}


// =============================================
// 9. START TYPING TEST
// =============================================

function startTest() {

    resetTest();

    isRunning = true;

    typingInput.disabled = false;

    typingInput.focus();

    startButton.disabled = true;

    startTime = Date.now();

    timer = setInterval(function () {

        timeLeft--;

        timerElement.textContent = timeLeft;

        updateStatistics();

        if (timeLeft <= 0) {

            endTest();

        }

    }, 1000);

}


// =============================================
// 10. TYPING TEST INPUT EVENT
// =============================================

typingInput.addEventListener("input", function () {

    if (!isRunning) return;

    updateStatistics();

    const originalText = textDisplay.textContent;

    if (typingInput.value.length >= originalText.length) {

        endTest();

    }

});


// =============================================
// 11. TYPING TEST BUTTON EVENTS
// =============================================

startButton.addEventListener("click", startTest);

resetButton.addEventListener("click", resetTest);


// =============================================
// 12. TEST DURATION CHANGE
// =============================================

timeSelect.addEventListener("change", resetTest);


// =============================================
// 13. TEST LANGUAGE CHANGE
// =============================================

languageSelect.addEventListener("change", function () {

    resetTest();

});


// =============================================
// 14. PRACTICE VARIABLES
// =============================================

let practiceStartTime = null;

let practiceFinished = false;


// =============================================
// 15. RESET PRACTICE
// =============================================

function resetPractice() {

    practiceInput.value = "";

    practiceInput.disabled = false;

    practiceStartTime = null;

    practiceFinished = false;

    practiceWpm.textContent = "0";

    practiceAccuracy.textContent = "100%";

    practiceErrors.textContent = "0";

    practiceMessage.textContent = "";

    practiceText.textContent =
        practiceTexts[practiceLevel.value];

}


// =============================================
// 16. UPDATE PRACTICE STATISTICS
// =============================================

function updatePracticeStatistics() {

    const typedText = practiceInput.value;

    const originalText = practiceText.textContent;

    if (typedText.length === 0) return;

    const elapsedSeconds = Math.max(
        1,
        (Date.now() - practiceStartTime) / 1000
    );

    const stats = calculateStatistics(
        typedText,
        originalText,
        elapsedSeconds
    );

    practiceWpm.textContent = stats.wpm;

    practiceAccuracy.textContent =
        stats.accuracy + "%";

    practiceErrors.textContent = stats.errors;

}


// =============================================
// 17. PRACTICE INPUT EVENT
// =============================================

practiceInput.addEventListener("input", function () {

    if (practiceFinished) return;

    if (practiceInput.value.length === 0) {

        practiceWpm.textContent = "0";

        practiceAccuracy.textContent = "100%";

        practiceErrors.textContent = "0";

        return;

    }

    if (practiceStartTime === null) {

        practiceStartTime = Date.now();

    }

    updatePracticeStatistics();

    const originalText = practiceText.textContent;

    if (practiceInput.value.length >= originalText.length) {

        practiceFinished = true;

        practiceInput.disabled = true;

        updatePracticeStatistics();

        practiceMessage.textContent =
            "Excellent! Practice completed. Your speed was " +
            practiceWpm.textContent +
            " WPM.";

    }

});


// =============================================
// 18. PRACTICE DIFFICULTY CHANGE
// =============================================

practiceLevel.addEventListener("change", function () {

    resetPractice();

});


// =============================================
// 19. PRACTICE RESTART BUTTON
// =============================================

practiceReset.addEventListener("click", function () {

    resetPractice();

    practiceInput.focus();

});


// =============================================
// 20. INITIALIZE WEBSITE
// =============================================

resetTest();

resetPractice();

console.log("TypeMaster initialized successfully!");

