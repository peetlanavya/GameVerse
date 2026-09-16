/* =========================================================
   HANGMAN — game logic
   ========================================================= */

// ---- Word bank: { category: [words...] } ----
const WORD_BANK = {
  Animals: ["elephant", "giraffe", "penguin", "dolphin", "kangaroo", "octopus"],
  Countries: ["canada", "brazil", "japan", "egypt", "australia", "portugal"],
  Food: ["pizza", "burger", "mango", "noodles", "pancake", "avocado"],
  Tech: ["keyboard", "internet", "software", "database", "algorithm", "browser"],
  Sports: ["cricket", "football", "tennis", "hockey", "boxing", "cycling"]
};

const MAX_WRONG_GUESSES = 6;
// The order these parts appear as wrong guesses pile up
const BODY_PARTS = [
  "part-head",
  "part-body",
  "part-arm-left",
  "part-arm-right",
  "part-leg-left",
  "part-leg-right"
];

// ---- Game state ----
let currentWord = "";
let currentCategory = "";
let guessedLetters = new Set();
let wrongGuesses = 0;
let gameActive = true;
let scores = { wins: 0, losses: 0 };
let currentStreak = 0; // consecutive wins without a loss — this is "Current Score"

// ---- Highest Score (persists across visits using localStorage) ----
// "Score" here = the best win streak ever achieved (consecutive wins,
// reset by any loss).
const HIGH_SCORE_KEY = "gameverse-hangman-highscore";

function loadHighScore() {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? parseInt(saved, 10) : 0;
}

function saveHighScoreIfBeaten(current) {
  const best = loadHighScore();
  if (current > best) {
    localStorage.setItem(HIGH_SCORE_KEY, String(current));
    return current;
  }
  return best;
}

// ---- DOM references ----
const wordDisplayEl = document.getElementById("wordDisplay");
const categoryTagEl = document.getElementById("categoryTag");
const messageEl = document.getElementById("message");
const keyboardEl = document.getElementById("keyboard");
const guessesLeftEl = document.getElementById("guessesLeft");
const scoreWinsEl = document.getElementById("scoreWins");
const scoreLossesEl = document.getElementById("scoreLosses");
const newWordBtn = document.getElementById("newWordBtn");
const resetScoreBtn = document.getElementById("resetScoreBtn");
const currentScoreEl = document.getElementById("currentScore");
const highScoreEl = document.getElementById("highScore");

// ---- Build the on-screen A-Z keyboard once ----
function buildKeyboard() {
  keyboardEl.innerHTML = "";
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    const btn = document.createElement("button");
    btn.className = "key-btn";
    btn.textContent = letter;
    btn.dataset.letter = letter.toLowerCase();
    btn.addEventListener("click", () => guessLetter(letter.toLowerCase()));
    keyboardEl.appendChild(btn);
  }
}

// ---- Pick a random word from a random category ----
function pickWord() {
  const categories = Object.keys(WORD_BANK);
  currentCategory = categories[Math.floor(Math.random() * categories.length)];
  const words = WORD_BANK[currentCategory];
  currentWord = words[Math.floor(Math.random() * words.length)];
}

// ---- Render the blank/revealed letters ----
function renderWord() {
  wordDisplayEl.innerHTML = "";
  for (const ch of currentWord) {
    const slot = document.createElement("span");
    slot.className = "letter-slot";
    if (guessedLetters.has(ch)) {
      slot.textContent = ch.toUpperCase();
      slot.classList.add("revealed");
    } else {
      slot.textContent = " "; // non-breaking space keeps the underline width
    }
    wordDisplayEl.appendChild(slot);
  }
}

// ---- Render the hangman drawing based on wrong guess count ----
function renderHangman() {
  BODY_PARTS.forEach((id, i) => {
    document.getElementById(id).classList.toggle("shown", i < wrongGuesses);
  });
}

// ---- Handle a letter guess (from click or keyboard) ----
function guessLetter(letter) {
  if (!gameActive || guessedLetters.has(letter) || !/^[a-z]$/.test(letter)) return;

  guessedLetters.add(letter);
  const keyBtn = keyboardEl.querySelector(`[data-letter="${letter}"]`);

  if (currentWord.includes(letter)) {
    if (keyBtn) keyBtn.classList.add("correct");
    renderWord();
    checkWinCondition();
  } else {
    wrongGuesses++;
    if (keyBtn) keyBtn.classList.add("wrong");
    renderHangman();
    updateGuessesLeft();
    checkLoseCondition();
  }

  if (keyBtn) keyBtn.disabled = true;
}

function updateGuessesLeft() {
  const remaining = MAX_WRONG_GUESSES - wrongGuesses;
  guessesLeftEl.textContent = remaining;
  guessesLeftEl.classList.toggle("low", remaining <= 2);
}

function checkWinCondition() {
  const solved = currentWord.split("").every((ch) => guessedLetters.has(ch));
  if (solved) endGame(true);
}

function checkLoseCondition() {
  if (wrongGuesses >= MAX_WRONG_GUESSES) endGame(false);
}

// ---- End of round ----
function endGame(won) {
  gameActive = false;
  disableKeyboard();

  if (won) {
    scores.wins++;
    scoreWinsEl.textContent = scores.wins;
    currentStreak++;
    messageEl.textContent = "You got it! 🎉";
    messageEl.className = "message-banner win";
  } else {
    scores.losses++;
    scoreLossesEl.textContent = scores.losses;
    currentStreak = 0; // a loss breaks the streak
    // reveal the full word so the player can see what it was
    guessedLetters = new Set(currentWord.split(""));
    renderWord();
    messageEl.textContent = `Out of guesses! The word was "${currentWord.toUpperCase()}"`;
    messageEl.className = "message-banner lose";
  }

  updateCurrentAndHighScore();
}

// ---- Update the Current Score / Highest Score chips ----
function updateCurrentAndHighScore() {
  const previousBest = loadHighScore();
  currentScoreEl.textContent = currentStreak;

  const newBest = saveHighScoreIfBeaten(currentStreak);
  highScoreEl.textContent = newBest;

  if (currentStreak > previousBest && currentStreak > 0) {
    const highChip = highScoreEl.closest(".status-chip");
    highChip.classList.add("pulse");
    setTimeout(() => highChip.classList.remove("pulse"), 850);
  }
}

function disableKeyboard() {
  keyboardEl.querySelectorAll(".key-btn").forEach((btn) => (btn.disabled = true));
}

// ---- Start a fresh round (keeps scores) ----
function startRound() {
  pickWord();
  guessedLetters = new Set();
  wrongGuesses = 0;
  gameActive = true;

  categoryTagEl.textContent = `Category: ${currentCategory}`;
  renderWord();
  renderHangman();
  updateGuessesLeft();
  messageEl.textContent = "Guess a letter to begin!";
  messageEl.className = "message-banner info";

  keyboardEl.querySelectorAll(".key-btn").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong");
  });
}

// ---- Physical keyboard support ----
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (/^[a-z]$/.test(key)) guessLetter(key);
});

// ---- Wire up buttons ----
newWordBtn.addEventListener("click", startRound);
resetScoreBtn.addEventListener("click", () => {
  scores = { wins: 0, losses: 0 };
  currentStreak = 0;
  scoreWinsEl.textContent = "0";
  scoreLossesEl.textContent = "0";
  currentScoreEl.textContent = "0";
  // Highest Score is intentionally NOT reset here — it's a persistent
  // best-ever record, separate from this session's running tally.
  startRound();
});

// ---- Init ----
buildKeyboard();
startRound();
currentScoreEl.textContent = "0";
highScoreEl.textContent = loadHighScore();
