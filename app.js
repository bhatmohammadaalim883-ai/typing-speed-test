
// =====================================
// TYPEMASTER - TYPING SPEED TEST
// =====================================


// 1. SELECT HTML ELEMENTS

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


// 2. TYPING TEXTS

const typingTexts = {
    en: "The quick brown fox jumps over the lazy dog. Practice every day to improve your typing speed and accuracy.",
    
    hi: "अभ्यास करने से हमारी गति और सटीकता में सुधार होता है। नियमित अभ्यास सफलता की कुंजी है।",
    
    ur: "محنت اور مسلسل مشق سے انسان اپنی صلاحیتوں کو بہتر بنا سکتا ہے۔"
};


// 3. TEST VARIABLES

let timeLeft = 30;
let timer = null;
let isRunning = false;
let startTime = null;


// 4. RESET TEST

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

    textDisplay.textContent =
        typingTexts[languageSelect.value];
}


// 5. START TEST

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


// 6. CALCULATE WPM AND ACCURACY

function updateStatistics() {

    const typedText = typingInput.value;

    const originalText = textDisplay.textContent;

    let correctCharacters = 0;
    let errors = 0;

    for (let i = 0; i < typedText.length; i++) {

        if (typedText[i] === originalText[i]) {
            correctCharacters++;
        } else {
            errors++;
        }

    }

    const elapsedTime = (Date.now() - startTime) / 1000;

    const minutes = elapsedTime / 60;

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

    wpmElement.textContent = wpm;

    accuracyElement.textContent = accuracy + "%";

    errorsElement.textContent = errors;

}


// 7. END TEST

function endTest() {

    clearInterval(timer);

    isRunning = false;

    typingInput.disabled = true;

    startButton.disabled = false;

    updateStatistics();

    resultMessage.textContent =
        "Test completed! Your typing speed is " +
        wpmElement.textContent +
        " WPM.";

}


// 8. CHECK TYPING INPUT

typingInput.addEventListener("input", function () {

    if (!isRunning) return;

    updateStatistics();

    const originalText = textDisplay.textContent;

    if (typingInput.value.length >= originalText.length) {
        endTest();
    }

});


// 9. BUTTON EVENTS

startButton.addEventListener("click", startTest);

resetButton.addEventListener("click", resetTest);


// 10. CHANGE TEST DURATION

timeSelect.addEventListener("change", resetTest);


// 11. CHANGE LANGUAGE

languageSelect.addEventListener("change", function () {

    textDisplay.textContent =
        typingTexts[languageSelect.value];

    resetTest();

});


// 12. INITIALIZE WEBSITE

resetTest();
