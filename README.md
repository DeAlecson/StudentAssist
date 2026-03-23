# StudentAssist

**A modular, AI-powered study companion for SUSS students.**

> Learn smarter with flashcards, guided lessons, AI-marked assessments, and exam-mode mixed runs — all in one progressive web app.

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue)](https://dealecson.github.io/StudentAssist/)

---

## Modules

| Module | Code | Status | Study Units |
|--------|------|--------|-------------|
| Object Oriented Programming | ICT162 | ✅ Active | 6 SUs |
| Project Management | SST101 | ✅ Active | 6 SUs |
| Accounting for Decision Making | ACC202 | ✅ Active | 6 SUs |
| Marketing Management | MKT202 | 🔜 Coming Soon | — |

---

## Features

### 4 Study Modes

| Mode | Description |
|------|-------------|
| **📖 Learn Mode** | Per-SU guided path: Flashcards → Lesson walkthrough with checkpoints → AI-marked mini assessment |
| **❓ Quiz Run** | MCQ question bank per Study Unit. Instant feedback, weak-topic tracking |
| **🎯 Assessment** | AI-generated short-answer questions, AI-marked with feedback. Falls back to model answers if no API key |
| **🔀 Mixed Run** | 20-question timed exam across all SUs. Leaderboard submission |

### Additional Features
- 🏆 **Global Leaderboard** — Shared Google Sheets leaderboard across all students
- ⚡ **XP & Levels** — Earn XP for correct answers, completed lessons, and assessments
- 🔥 **Daily Streaks** — Maintain your study streak
- ⚠️ **Weak Topic Tracking** — Automatically tracks concepts you miss most
- 🤖 **AI Marking** — Claude claude-haiku-4-5 marks short-answer responses (optional API key)
- 📱 **PWA** — Install on mobile, works offline
- 🌙 **Dark Theme** — Easy on the eyes

---

## Getting Started

### Option 1 — GitHub Pages (Recommended)
1. Fork this repository
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Visit `https://yourusername.github.io/StudentAssist/`

### Option 2 — Local Development
```bash
# Clone the repo
git clone https://github.com/DeAlecson/StudentAssist.git
cd StudentAssist

# Serve with any static file server (required for fetch() to work)
npx serve .
# OR
python3 -m http.server 8080
```
Then open `http://localhost:8080`

> ⚠️ **Important**: Do NOT open `index.html` directly from the file system — `fetch()` calls for JSON data require a server.

---

## AI Marking (Optional)

To enable AI marking and AI-generated assessments:
1. Get a free API key from [console.anthropic.com](https://console.anthropic.com)
2. Open StudentAssist → Settings (⚙ icon) → Enter your API key
3. The key is stored in **sessionStorage only** — it clears when you close the tab

Without an API key, the app still works fully — assessment mode shows model answers instead.

---

## Project Structure

```
StudentAssist/
├── index.html              # Main SPA entry point
├── manifest.webmanifest    # PWA manifest
├── service-worker.js       # Offline caching
├── css/
│   ├── themes.css          # CSS variables & animations
│   └── styles.css          # Full component library
├── js/
│   ├── utils.js            # DOM helpers, markdown, toast
│   ├── state.js            # Global runtime state
│   ├── storage.js          # localStorage persistence
│   ├── router.js           # Hash-based SPA router
│   ├── app.js              # Boot sequence & module loading
│   ├── gamification.js     # XP, levels, streaks
│   ├── leaderboard.js      # Google Sheets integration
│   ├── ai.js               # Anthropic API wrapper
│   ├── learn-engine.js     # Learn Mode (Phase 1-3)
│   ├── quiz-engine.js      # Quiz Run mode
│   ├── assessment-engine.js # Assessment mode
│   ├── mixed-engine.js     # Mixed Run / Exam mode
│   └── renderer.js         # View rendering
└── data/
    ├── modules.json         # Module registry
    ├── ict162/
    │   ├── config.json
    │   ├── lessons/         # su1.json … su6.json
    │   ├── quizzes/         # su1_quiz.json … su6_quiz.json
    │   └── flashcards/      # su1_cards.json … su6_cards.json
    ├── sst101/              # Same structure
    └── acc202/              # Same structure
```

---

## Adding a New Module (e.g., MKT202)

StudentAssist is built to be extended. To add MKT202:

**Step 1 — Register in `data/modules.json`:**
```json
{
  "id": "mkt202",
  "code": "MKT202",
  "title": "Marketing Management",
  "icon": "📣",
  "color": "#f472b6",
  "colorRGB": "244,114,182",
  "description": "Marketing strategy, consumer behaviour, segmentation and the 4Ps.",
  "chips": ["6 Study Units", "AI Marking"],
  "available": true,
  "configFile": "data/mkt202/config.json"
}
```

**Step 2 — Create the data folder:**
```
data/mkt202/
├── config.json
├── lessons/su1.json … su6.json
├── quizzes/su1_quiz.json … su6_quiz.json
└── flashcards/su1_cards.json … su6_cards.json
```

**Step 3 — Follow the data schema** (same as ICT162/SST101/ACC202)

That's it — no code changes needed. The app will automatically detect and load the new module.

---

## Data Schemas

### Module Config (`data/{module}/config.json`)
```json
{
  "id": "ict162",
  "code": "ICT162",
  "title": "Object Oriented Programming",
  "color": "#00d4ff",
  "icon": "💻",
  "units": [
    {
      "id": "su1",
      "title": "Classes & Objects",
      "icon": "🧱",
      "description": "...",
      "lessonFile": "data/ict162/lessons/su1.json",
      "quizFile": "data/ict162/quizzes/su1_quiz.json",
      "flashcardFile": "data/ict162/flashcards/su1_cards.json"
    }
  ]
}
```

### Lesson File (`lessons/su{n}.json`)
```json
{
  "id": "su1",
  "title": "Classes & Objects",
  "moduleId": "ict162",
  "sections": [
    { "type": "intro|definition|example|concept", "title": "...", "content": "markdown" },
    { "type": "checkpoint", "title": "...", "content": "...",
      "question": { "type": "mcq", "prompt": "...", "choices": [...], "answer": 0, "explanation": "..." } }
  ],
  "assessment": {
    "questions": [
      { "id": "su1_a1", "prompt": "...", "modelAnswer": "...", "keyPoints": ["..."] }
    ]
  }
}
```

### Quiz File (`quizzes/su{n}_quiz.json`)
```json
{
  "unitId": "su1",
  "moduleId": "ict162",
  "questions": [
    { "id": "su1_q1", "type": "mcq", "concept": "...", "prompt": "...",
      "difficulty": 1, "choices": [...], "answer": 0, "explanation": "..." }
  ]
}
```

### Flashcard File (`flashcards/su{n}_cards.json`)
```json
{
  "unitId": "su1",
  "moduleId": "ict162",
  "cards": [
    { "id": "su1_f1", "front": "Term or question", "back": "Definition or answer", "concept": "tag" }
  ]
}
```

---

## Leaderboard

The global leaderboard uses a Google Apps Script backend (already deployed). Scores are submitted automatically after Quiz Run, Mixed Run, and Assessment modes.

To use your own leaderboard backend, replace the `SHEET_URL` constant in `js/leaderboard.js`.

---

## Credits

- Built with vanilla JS, no framework dependencies
- AI marking powered by [Anthropic Claude](https://claude.ai)
- Fonts: [DM Sans](https://fonts.google.com/specimen/DM+Sans) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)
- Inspired by [Encapsulate](https://github.com/DeAlecson/Encapsulate) (ICT162 OOP Coach)

---

*SUSS · StudentAssist v1.0.0 · 2026*
