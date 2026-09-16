# 🎮 GAMEVERSE

**Play • Challenge • Have Fun**

GAMEVERSE is a small game hub built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no installation. Open one file in a browser and everything works.

It includes three fully playable games:

- ❌ **Tic-Tac-Toe** — classic 3×3 duel, with a 2-player mode and a vs-computer mode
- 🪢 **Hangman** — guess the word letter by letter before you run out of tries
- 🧠 **Memory Game** — flip cards and find matching pairs in as few moves as possible

All three games share one consistent visual theme (colors, fonts, buttons, animations) so the whole site feels like one platform, even though each game's code is fully separated from the others.

## How to run it

No installation and no server required.

1. Open the `gameverse` folder.
2. Double-click `index.html` (or right-click → **Open with** → your browser).
3. That's it — the home page loads and you can click into any game.

If double-clicking doesn't work well in your browser (some browsers restrict local file access), you can instead run a tiny local server from inside the `gameverse` folder and visit the printed address:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Folder structure

```
gameverse/
├── index.html              
├── README.md                
├── css/
│   ├── style.css            
│   └── home.css              
├── tic-tac-toe/
│   ├── index.html            
│   ├── style.css              
│   └── script.js               
├── hangman/
│   ├── index.html
│   ├── style.css              
│   └── script.js               
└── memory-game/
    ├── index.html
    ├── style.css              
    └── script.js               
```

Each game folder is self-contained: its own HTML, its own CSS, and its own JavaScript. You can open, edit, or hand off any single game without touching the other two. The only shared file is `css/style.css`, which holds the look-and-feel that all pages have in common (the header, the back button, buttons, status chips, and shared animations).

## How each game works

### ❌ Tic-Tac-Toe

- Toggle between **2 Players** (pass-the-device) and **vs Computer** mode.
- The computer opponent isn't random — it checks for a winning move first, then blocks your winning move, then falls back to strategic cells (center, then corners).
- Tracks wins for Player X, Player O (or Computer), and draws for the current session.
- **Current Score** is your win count this session; **Highest Score** is the most wins you've ever gotten in one sitting on this browser, and it's saved permanently (via the browser's local storage) even after you close the tab.
- **New Round** starts a fresh board without resetting scores. **Reset Scores** clears the session tally, but never erases your all-time Highest Score.

### 🪢 Hangman

- Words are pulled from five categories (Animals, Countries, Food, Tech, Sports).
- Guess letters by clicking the on-screen keyboard or typing on your physical keyboard.
- The hangman figure is drawn piece by piece (six wrong guesses = fully drawn figure = loss).
- **Current Score** is your current win streak (resets to 0 on any loss); **Highest Score** is your best streak ever, saved permanently.
- **New Word** starts a new round. **Reset Scores** clears the session's win/loss tally, but keeps your all-time Highest Score.

### 🧠 Memory Game

- Choose between **4×3 (Easy)** — 6 pairs — or **4×4 (Hard)** — 8 pairs.
- Flip two cards at a time; matching pairs stay face-up, mismatches flip back.
- Tracks moves taken and time elapsed as you play.
- **Current Score** is how many moves your last completed game took; **Highest Score** is the fewest moves you've ever used to win — tracked separately for Easy and Hard, since they're not really comparable. Saved permanently via local storage.
- **New Game** shuffles a fresh board at the current difficulty.

## Notes on the code

- No external libraries or frameworks — everything is vanilla HTML, CSS, and JavaScript, so it's easy to read and modify.
- "Highest Score" values are stored in the browser's `localStorage`, scoped to whichever browser and device you're using. Clearing your browser's site data will reset them.
- The site is responsive: all pages adapt to both desktop and mobile screen widths, including the on-screen Hangman keyboard and the Memory Game board.

## Customizing

- To change the shared color theme, fonts, or button styles across the whole site, edit `css/style.css`.
- To change the home page layout or card styling only, edit `css/home.css`.
- To change a specific game's rules, wording, or difficulty, edit that game's own `script.js` — for example, add more words to the `WORD_BANK` in `hangman/script.js`, or add more emoji to `EMOJI_POOL` in `memory-game/script.js` to support a bigger board.
