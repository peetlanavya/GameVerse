/* =========================================================
   TIC-TAC-TOE — game logic
   Supports "2 Players" mode and "vs Computer" mode.
   ========================================================= */

// ---- Game state ----
let board = Array(9).fill(null);     // 9 cells, each null | "X" | "O"
let currentPlayer = "X";             // whose turn it is
let gameActive = true;               // false once someone wins / draw
let vsComputer = false;              // current mode
let scores = { X: 0, O: 0, draw: 0 };

// ---- Highest Score (persists across visits using localStorage) ----
// "Score" here = Player X's win count (X is always the human player,
// whether the opponent is a second person or the computer).
const HIGH_SCORE_KEY = "gameverse-tictactoe-highscore";

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

// All possible winning lines (by cell index)
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

// ---- DOM references ----
const boardEl = document.getElementById("board");
const messageEl = document.getElementById("message");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreDrawEl = document.getElementById("scoreDraw");
const labelOEl = document.getElementById("labelO");
const mode2pBtn = document.getElementById("mode2p");
const modeCpuBtn = document.getElementById("modeCpu");
const restartBtn = document.getElementById("restartBtn");
const resetScoreBtn = document.getElementById("resetScoreBtn");
const currentScoreEl = document.getElementById("currentScore");
const highScoreEl = document.getElementById("highScore");

// ---- Build the 9 cells once ----
function buildBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.addEventListener("click", () => handleCellClick(i));
    boardEl.appendChild(cell);
  }
}

// ---- Render current board state onto the cells ----
function renderBoard(winningLine) {
  const cells = boardEl.querySelectorAll(".cell");
  cells.forEach((cell, i) => {
    const value = board[i];
    cell.textContent = value || "";
    cell.classList.remove("x-mark", "o-mark", "filled", "win-cell");
    if (value === "X") cell.classList.add("x-mark", "filled");
    if (value === "O") cell.classList.add("o-mark", "filled");
    if (winningLine && winningLine.includes(i)) cell.classList.add("win-cell");
  });
  boardEl.classList.toggle("locked", !gameActive);
}

// ---- Check for a winner. Returns { winner, line } or null ----
function checkWinner(b) {
  for (const line of WIN_LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { winner: b[a], line };
    }
  }
  if (b.every((cell) => cell !== null)) {
    return { winner: "draw", line: null };
  }
  return null;
}

// ---- Handle a click on a cell ----
function handleCellClick(index) {
  if (!gameActive || board[index] !== null) return;
  // In vs-computer mode, block clicks during the computer's turn
  if (vsComputer && currentPlayer === "O") return;

  placeMark(index, currentPlayer);

  const result = checkWinner(board);
  if (result) {
    endRound(result);
    return;
  }

  switchTurn();

  // If it's now the computer's turn, let it move after a short delay
  if (vsComputer && currentPlayer === "O" && gameActive) {
    setTimeout(computerMove, 400);
  }
}

function placeMark(index, player) {
  board[index] = player;
  renderBoard();
}

function switchTurn() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  const who = vsComputer && currentPlayer === "O" ? "Computer" : `Player ${currentPlayer}`;
  messageEl.textContent = `${who}'s turn`;
  messageEl.className = "message-banner info";
}

// ---- Simple computer opponent ----
// Priority: 1) win if possible  2) block player's win  3) take center
// 4) take a corner  5) take any open cell.
function computerMove() {
  if (!gameActive) return;

  const empties = board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
  if (empties.length === 0) return;

  let move = findWinningMove("O") ?? findWinningMove("X") ?? pickStrategicCell(empties);

  placeMark(move, "O");
  const result = checkWinner(board);
  if (result) {
    endRound(result);
    return;
  }
  switchTurn();
}

function findWinningMove(player) {
  for (const line of WIN_LINES) {
    const values = line.map((i) => board[i]);
    const nullCount = values.filter((v) => v === null).length;
    const playerCount = values.filter((v) => v === player).length;
    if (nullCount === 1 && playerCount === 2) {
      return line[values.indexOf(null)];
    }
  }
  return null;
}

function pickStrategicCell(empties) {
  if (empties.includes(4)) return 4; // center
  const corners = [0, 2, 6, 8].filter((i) => empties.includes(i));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empties[Math.floor(Math.random() * empties.length)];
}

// ---- End of round (win or draw) ----
function endRound({ winner, line }) {
  gameActive = false;
  renderBoard(line);

  if (winner === "draw") {
    scores.draw++;
    scoreDrawEl.textContent = scores.draw;
    messageEl.textContent = "It's a draw!";
    messageEl.className = "message-banner draw";
  } else {
    scores[winner]++;
    (winner === "X" ? scoreXEl : scoreOEl).textContent = scores[winner];
    const who = vsComputer && winner === "O" ? "Computer" : `Player ${winner}`;
    messageEl.textContent = `${who} wins! 🎉`;
    messageEl.className = "message-banner win";

    if (winner === "X") {
      updateCurrentAndHighScore();
    }
  }
}

// ---- Update the Current Score / Highest Score chips ----
function updateCurrentAndHighScore() {
  const previousBest = loadHighScore();
  currentScoreEl.textContent = scores.X;

  const newBest = saveHighScoreIfBeaten(scores.X);
  highScoreEl.textContent = newBest;

  // Give the Highest Score chip a little celebratory pulse when a new record is set
  if (scores.X > previousBest) {
    const highChip = highScoreEl.closest(".status-chip");
    highChip.classList.add("pulse");
    setTimeout(() => highChip.classList.remove("pulse"), 850);
  }
}

// ---- Start a fresh round (keeps scores) ----
function startRound() {
  board = Array(9).fill(null);
  currentPlayer = "X";
  gameActive = true;
  renderBoard();
  messageEl.textContent = "Player X's turn";
  messageEl.className = "message-banner info";
}

// ---- Mode switching ----
function setMode(isCpu) {
  vsComputer = isCpu;
  mode2pBtn.classList.toggle("active", !isCpu);
  modeCpuBtn.classList.toggle("active", isCpu);
  labelOEl.textContent = isCpu ? "Computer" : "Player O";
  startRound();
}

// ---- Wire up buttons ----
mode2pBtn.addEventListener("click", () => setMode(false));
modeCpuBtn.addEventListener("click", () => setMode(true));
restartBtn.addEventListener("click", startRound);
resetScoreBtn.addEventListener("click", () => {
  scores = { X: 0, O: 0, draw: 0 };
  scoreXEl.textContent = "0";
  scoreOEl.textContent = "0";
  scoreDrawEl.textContent = "0";
  currentScoreEl.textContent = "0";
  // Highest Score is intentionally NOT reset here — it's a persistent
  // best-ever record, separate from this session's running tally.
  startRound();
});

// ---- Init ----
buildBoard();
startRound();
currentScoreEl.textContent = "0";
highScoreEl.textContent = loadHighScore();
