/* =========================================================
   MEMORY GAME — game logic
   ========================================================= */

// Emoji pool — we slice however many pairs the current difficulty needs
const EMOJI_POOL = ["🐱", "🐶", "🦊", "🐼", "🐸", "🦁", "🐵", "🐷", "🐔", "🐧", "🦄", "🐙"];

// ---- Game state ----
let difficulty = "easy";     // "easy" = 4x3 (6 pairs), "hard" = 4x4 (8 pairs)
let cards = [];              // array of { emoji, id }
let flippedIndexes = [];     // currently face-up, unmatched cards (max 2)
let matchedCount = 0;
let totalPairs = 6;
let moveCount = 0;
let timerSeconds = 0;
let timerInterval = null;
let boardLocked = false;     // true briefly while showing a mismatch

// ---- Highest Score (persists across visits using localStorage) ----
// "Score" here = fewest moves ever used to win. Tracked separately per
// difficulty since 4x3 and 4x4 boards aren't comparable.
function highScoreKey() {
  return `gameverse-memory-highscore-${difficulty}`;
}

function loadHighScore() {
  const saved = localStorage.getItem(highScoreKey());
  return saved ? parseInt(saved, 10) : null; // null = no record yet
}

// Lower moves = better, so "beaten" means current < best (or no record yet)
function saveHighScoreIfBeaten(current) {
  const best = loadHighScore();
  if (best === null || current < best) {
    localStorage.setItem(highScoreKey(), String(current));
    return current;
  }
  return best;
}

// ---- DOM references ----
const boardEl = document.getElementById("memoryBoard");
const messageEl = document.getElementById("message");
const moveCountEl = document.getElementById("moveCount");
const matchCountEl = document.getElementById("matchCount");
const timerEl = document.getElementById("timer");
const newGameBtn = document.getElementById("newGameBtn");
const diffEasyBtn = document.getElementById("diffEasy");
const diffHardBtn = document.getElementById("diffHard");
const currentScoreEl = document.getElementById("currentScore");
const highScoreEl = document.getElementById("highScore");

// ---- Shuffle helper (Fisher-Yates) ----
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Build a fresh shuffled deck ----
function buildDeck() {
  totalPairs = difficulty === "hard" ? 8 : 6;
  const chosenEmojis = EMOJI_POOL.slice(0, totalPairs);
  const pairEmojis = shuffle([...chosenEmojis, ...chosenEmojis]);
  cards = pairEmojis.map((emoji, i) => ({ emoji, id: i }));
}

// ---- Render the board from scratch ----
function renderBoard() {
  boardEl.className = `memory-board ${difficulty === "hard" ? "grid-4x4" : "grid-4x3"}`;
  boardEl.innerHTML = "";

  cards.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "memory-card";
    cardEl.dataset.index = index;

    cardEl.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${card.emoji}</div>
      </div>
    `;

    cardEl.addEventListener("click", () => handleCardClick(index));
    boardEl.appendChild(cardEl);
  });
}

function getCardEl(index) {
  return boardEl.querySelector(`.memory-card[data-index="${index}"]`);
}

// ---- Handle a card click ----
function handleCardClick(index) {
  if (boardLocked) return;
  const cardEl = getCardEl(index);
  if (cardEl.classList.contains("flipped") || cardEl.classList.contains("matched")) return;
  if (flippedIndexes.length === 2) return;

  cardEl.classList.add("flipped");
  flippedIndexes.push(index);

  startTimerIfNeeded();

  if (flippedIndexes.length === 2) {
    moveCount++;
    moveCountEl.textContent = moveCount;
    evaluatePair();
  }
}

// ---- Compare the two currently flipped cards ----
function evaluatePair() {
  const [i1, i2] = flippedIndexes;
  const match = cards[i1].emoji === cards[i2].emoji;

  if (match) {
    boardLocked = true;
    setTimeout(() => {
      getCardEl(i1).classList.add("matched");
      getCardEl(i2).classList.add("matched");
      flippedIndexes = [];
      boardLocked = false;
      matchedCount++;
      matchCountEl.textContent = `${matchedCount}/${totalPairs}`;
      messageEl.textContent = "Nice match! 🎯";
      messageEl.className = "message-banner win";

      if (matchedCount === totalPairs) {
        finishGame();
      }
    }, 350);
  } else {
    boardLocked = true;
    getCardEl(i1).classList.add("shake");
    getCardEl(i2).classList.add("shake");
    messageEl.textContent = "Not a match — try again!";
    messageEl.className = "message-banner info";

    setTimeout(() => {
      getCardEl(i1).classList.remove("flipped", "shake");
      getCardEl(i2).classList.remove("flipped", "shake");
      flippedIndexes = [];
      boardLocked = false;
    }, 700);
  }
}

// ---- Timer ----
function startTimerIfNeeded() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSeconds++;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    timerEl.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// ---- Win state ----
function finishGame() {
  stopTimer();
  messageEl.textContent = `🎉 Solved in ${moveCount} moves and ${timerEl.textContent}!`;
  messageEl.className = "message-banner win";
  updateCurrentAndHighScore();
}

// ---- Update the Current Score / Highest Score chips ----
// Score = moves taken to win (lower is better).
function updateCurrentAndHighScore() {
  const previousBest = loadHighScore();
  currentScoreEl.textContent = moveCount;

  const newBest = saveHighScoreIfBeaten(moveCount);
  highScoreEl.textContent = newBest;

  const isNewRecord = previousBest === null || moveCount < previousBest;
  if (isNewRecord) {
    const highChip = highScoreEl.closest(".status-chip");
    highChip.classList.add("pulse");
    setTimeout(() => highChip.classList.remove("pulse"), 850);
  }
}

// ---- Refresh the score chips for the active difficulty (no game result yet) ----
function refreshScoreDisplayForDifficulty() {
  const best = loadHighScore();
  highScoreEl.textContent = best === null ? "—" : best;
  currentScoreEl.textContent = "—";
}

// ---- Start a brand new game ----
function startGame() {
  stopTimer();
  timerSeconds = 0;
  timerEl.textContent = "0:00";
  moveCount = 0;
  moveCountEl.textContent = "0";
  matchedCount = 0;
  matchCountEl.textContent = `0/${totalPairs === 8 ? 8 : 6}`;
  flippedIndexes = [];
  boardLocked = false;
  messageEl.textContent = "Flip two cards to find a match!";
  messageEl.className = "message-banner info";

  buildDeck();
  matchCountEl.textContent = `0/${totalPairs}`;
  renderBoard();
  refreshScoreDisplayForDifficulty();
}

// ---- Difficulty switching ----
function setDifficulty(level) {
  difficulty = level;
  diffEasyBtn.classList.toggle("active", level === "easy");
  diffHardBtn.classList.toggle("active", level === "hard");
  startGame();
}

// ---- Wire up buttons ----
newGameBtn.addEventListener("click", startGame);
diffEasyBtn.addEventListener("click", () => setDifficulty("easy"));
diffHardBtn.addEventListener("click", () => setDifficulty("hard"));

// ---- Init ----
startGame();
