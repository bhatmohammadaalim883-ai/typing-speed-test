
// ======================================
// TYPEMASTER TYPING TEST SYSTEM
// ======================================

// Use the same domain for frontend and backend
const API_URL = "";

// ======================================
// 1. TYPING PASSAGES
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
// 2. PRACTICE EXERCISES
// ======================================

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
  message: document.getElementById("resultMessage"),
  practiceTitle: document.getElementById("practiceTitle"),
  practiceText: document.getElementById("practiceText"),
  practiceInput: document.getElementById("practiceInput"),
  practiceWpm: document.getElementById("practiceWpm"),
  practiceAccuracy: document.getElementById("practiceAccuracy"),
  practiceErrors: document.getElementById("practiceErrors"),
  practiceReset: document.getElementById("practiceReset")
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
let currentPractice = "sentences";
let practiceStartedAt = null;

// ======================================
// 5. WORD PASSAGE GENERATOR
// ======================================

function makeWordPassage(count) {

  const easy = ["apple", "school", "happy", "water", "music"];

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
// 7. GET TYPING PASSAGE
// ======================================

function getPassage() {

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
// 8. RENDER PASSAGE
// ======================================

function renderPassage(typed = "") {

  elements.display.replaceChildren();

  for (let i = 0; i < passage.length; i++) {

    const span = document.createElement("span");

    span.textContent = passage[i];

    if (i < typed.length) {

      span.className =
        typed[i] === passage[i] ? "correct" : "incorrect";

    }

    elements.display.appendChild(span);

  }

}

// ======================================
// 9. CALCULATE TYPING STATISTICS
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
// 10. UPDATE TYPING STATISTICS
// ======================================

function updateStats() {

  const stats = calculateStats(
    elements.input.value,
    elapsedSeconds
  );

  elements.wpm.textContent = stats.wpm;

  elements.accuracy.textContent = stats.accuracy + "%";

  elements.errors.textContent = stats.errors;

  renderPassage(elements.input.value);

  return stats;

}

// ======================================
// 11. RESET TYPING TEST
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
// 12. SAVE RESULT TO DATABASE
// ======================================

async function saveResult(stats) {

  const token = sessionStorage.getItem("typemaster_token");

  if (!token) {
    return "Log in to save this result to your account.";
  }

  try {

    const response = await fetch(`${API_URL}/api/typing-tests`, {

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

    });

    const data = await response.json();

    if (response.status === 401) {

      sessionStorage.removeItem("typemaster_token");

      return "Your login session expired. Please log in again.";

    }

    if (!response.ok || !data.success) {

      return data.message || "Could not save your result.";

    }

    return "Your typing result was saved successfully!";

  } catch (error) {

    console.error("Save error:", error);

    return "Could not connect to the server. Please try again.";

  }

}

// ======================================
// 13. FINISH TYPING TEST
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

  const message = await saveResult(stats);

  elements.message.textContent = message;

}

// ======================================
// 14. START TYPING TEST
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
// 15. TEST BUTTON EVENTS
// ======================================

elements.start.addEventListener("click", startTest);

elements.reset.addEventListener("click", resetTest);

// ======================================
// 16. TYPING INPUT EVENT
// ======================================

elements.input.addEventListener("input", () => {

  if (!running) return;

  updateStats();

  if (elements.input.value.length >= passage.length) {
    finishTest();
  }

});

// ======================================
// 17. TEST SETTINGS EVENTS
// ======================================

[
  elements.mode,
  elements.duration,
  elements.difficulty,
  elements.language
].forEach(element => {

  element.addEventListener("change", resetTest);

});

// ======================================
// 18. LOAD PRACTICE EXERCISE
// ======================================

function loadPractice(type) {

  currentPractice = type;

  const exercise = practiceExercises[type];

  elements.practiceTitle.textContent = exercise.title;

  elements.practiceText.textContent = exercise.text;

  resetPractice();

}

// ======================================
// 19. RESET PRACTICE
// ======================================

function resetPractice() {

  elements.practiceInput.value = "";

  elements.practiceWpm.textContent = "0";

  elements.practiceAccuracy.textContent = "100%";

  elements.practiceErrors.textContent = "0";

  practiceStartedAt = null;

  elements.practiceInput.focus();

}

// ======================================
// 20. PRACTICE BUTTON EVENTS
// ======================================

document.querySelectorAll("[data-practice]").forEach(button => {

  button.addEventListener("click", () => {

    loadPractice(button.dataset.practice);

  });

});

elements.practiceReset.addEventListener("click", resetPractice);

// ======================================
// 21. PRACTICE INPUT EVENT
// ======================================

elements.practiceInput.addEventListener("input", () => {

  const typed = elements.practiceInput.value;

  const target = practiceExercises[currentPractice].text;

  if (!practiceStartedAt && typed.length) {
    practiceStartedAt = Date.now();
  }

  let correct = 0;
  let errors = 0;

  for (let i = 0; i < typed.length; i++) {

    if (typed[i] === target[i]) {
      correct++;
    } else {
      errors++;
    }

  }

  const elapsed = practiceStartedAt
    ? Math.max(
        1,
        (Date.now() - practiceStartedAt) / 1000
      )
    : 1;

  const wpm = Math.round(
    (correct / 5) / (elapsed / 60)
  );

  const accuracy = typed.length
    ? Math.round((correct / typed.length) * 100)
    : 100;

  elements.practiceWpm.textContent = wpm;

  elements.practiceAccuracy.textContent = accuracy + "%";

  elements.practiceErrors.textContent = errors;

});

// ======================================
// 22. INITIALIZE TYPEMASTER
// ======================================

resetTest();

loadPractice("sentences");

console.log("TypeMaster typing test initialized successfully!");
