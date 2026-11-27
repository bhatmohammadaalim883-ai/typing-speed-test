
// ======================================
// TYPEMASTER - TYPING GAMES
// ======================================

// HTML Elements

const gameArea = document.getElementById("gameArea");
const gameTitle = document.getElementById("gameTitle");
const gameDescription = document.getElementById("gameDescription");
const gameTimer = document.getElementById("gameTimer");
const gameScore = document.getElementById("gameScore");
const gamePrompt = document.getElementById("gamePrompt");
const gameInput = document.getElementById("gameInput");
const gameFeedback = document.getElementById("gameFeedback");
const startButton = document.getElementById("startGame");

// ======================================
// GAME WORDS AND SENTENCES
// ======================================

const words = [
  "keyboard", "computer", "practice", "success",
  "internet", "developer", "technology", "education",
  "language", "challenge", "accuracy", "creative"
];

const sentences = [
  "Practice makes progress.",
  "Typing improves with regular practice.",
  "Technology makes learning easier.",
  "Accuracy is just as important as speed."
];

// ======================================
// GAME VARIABLES
// ======================================

let currentGame = "";
let currentAnswer = "";
let score = 0;
let timeLeft = 60;
let interval = null;
let active = false;
let completedRounds = 0;

// ======================================
// LOCAL STORAGE
// ======================================

const STORAGE_KEY = "typemaster_game_stats";

// ======================================
// GET GAME STATISTICS
// ======================================

function getStats() {

  try {

    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      gamesPlayed: 0,
      bestScore: 0,
      totalPoints: 0
    };

  } catch {

    return {
      gamesPlayed: 0,
      bestScore: 0,
      totalPoints: 0
    };

  }

}

// ======================================
// UPDATE GAME STATISTICS
// ======================================

function updateStats() {

  const stats = getStats();

  document.getElementById("gamesPlayed").textContent =
    stats.gamesPlayed;

  document.getElementById("bestScore").textContent =
    stats.bestScore;

  document.getElementById("totalPoints").textContent =
    stats.totalPoints;

}

// ======================================
// SAVE GAME SCORE
// ======================================

function saveGameScore() {

  const stats = getStats();

  stats.gamesPlayed += 1;

  stats.totalPoints += score;

  stats.bestScore = Math.max(
    stats.bestScore,
    score
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(stats)
  );

  updateStats();

}

// ======================================
// RANDOM ITEM
// ======================================

function randomItem(array) {

  return array[
    Math.floor(Math.random() * array.length)
  ];

}

// ======================================
// SCRAMBLE WORD
// ======================================

function scramble(word) {

  let letters = word.split("");

  for (let i = letters.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [letters[i], letters[j]] =
      [letters[j], letters[i]];

  }

  if (letters.join("") === word) {
    letters.reverse();
  }

  return letters.join("");

}

// ======================================
// SELECT GAME
// ======================================

function chooseGame(type) {

  stopGame();

  currentGame = type;

  score = 0;

  timeLeft = 60;

  completedRounds = 0;

  const settings = {

    wordRain: {
      title: "Word Rain",
      description: "Type as many words correctly as you can.",
      duration: 60
    },

    typingRace: {
      title: "Typing Race",
      description: "Complete the typing challenges to race ahead.",
      duration: 60
    },

    wordScramble: {
      title: "Word Scramble",
      description: "Unscramble the letters and enter the correct word.",
      duration: 60
    },

    accuracyChallenge: {
      title: "Accuracy Challenge",
      description: "Type every sentence accurately.",
      duration: 90
    }

  };

  const selected = settings[type];

  if (!selected) return;

  gameTitle.textContent = selected.title;

  gameDescription.textContent = selected.description;

  timeLeft = selected.duration;

  gameTimer.textContent = timeLeft;

  gameScore.textContent = score;

  gameFeedback.textContent =
    "Press Start Game when you are ready.";

  gameInput.value = "";

  gameInput.disabled = true;

  startButton.disabled = false;

  startButton.textContent = "Start Game";

  gameArea.hidden = false;

  gameArea.scrollIntoView({
    behavior: "smooth"
  });

  showNextChallenge();

}

// ======================================
// SHOW NEXT CHALLENGE
// ======================================

function showNextChallenge() {

  if (
    currentGame === "wordRain" ||
    currentGame === "typingRace"
  ) {

    currentAnswer = randomItem(words);

    gamePrompt.textContent = currentAnswer;

  }

  if (currentGame === "wordScramble") {

    currentAnswer = randomItem(words);

    gamePrompt.textContent =
      "Unscramble: " + scramble(currentAnswer);

  }

  if (currentGame === "accuracyChallenge") {

    currentAnswer = randomItem(sentences);

    gamePrompt.textContent = currentAnswer;

  }

  gameInput.value = "";

}

// ======================================
// START GAME
// ======================================

function startGame() {

  if (active || !currentGame) return;

  score = 0;

  timeLeft =
    currentGame === "accuracyChallenge" ? 90 : 60;

  completedRounds = 0;

  gameScore.textContent = score;

  gameTimer.textContent = timeLeft;

  gameFeedback.textContent =
    "Game started! Good luck.";

  active = true;

  gameInput.disabled = false;

  startButton.disabled = true;

  gameInput.focus();

  interval = setInterval(() => {

    timeLeft--;

    gameTimer.textContent = timeLeft;

    if (timeLeft <= 0) {
      finishGame();
    }

  }, 1000);

}

// ======================================
// FINISH GAME
// ======================================

function finishGame() {

  if (!active) return;

  active = false;

  clearInterval(interval);

  gameInput.disabled = true;

  startButton.disabled = false;

  startButton.textContent = "Play Again";

  saveGameScore();

  gameFeedback.textContent =
    `Game finished! You scored ${score} points.`;

}

// ======================================
// STOP GAME
// ======================================

function stopGame() {

  active = false;

  clearInterval(interval);

  gameInput.disabled = true;

}

// ======================================
// GAME INPUT EVENT
// ======================================

gameInput.addEventListener("input", () => {

  if (!active) return;

  const typed = gameInput.value;

  if (typed === currentAnswer) {

    score +=
      currentGame === "accuracyChallenge" ? 20 : 10;

    completedRounds++;

    gameScore.textContent = score;

    gameFeedback.textContent =
      "Correct! Well done.";

    showNextChallenge();

  }

});

// ======================================
// START BUTTON EVENT
// ======================================

startButton.addEventListener("click", startGame);

// ======================================
// GAME SELECTION EVENTS
// ======================================

document.querySelectorAll("[data-game]").forEach(button => {

  button.addEventListener("click", () => {

    chooseGame(button.dataset.game);

  });

});

// ======================================
// CLOSE GAME
// ======================================

document.getElementById("closeGame").addEventListener("click", () => {

  stopGame();

  gameArea.hidden = true;

});

// ======================================
// INITIALIZE GAMES
// ======================================

updateStats();

console.log("TypeMaster games initialized successfully!");
