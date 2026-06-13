# 🌈 Magic Learning Toolbox: Project Summary

## 📖 Overview
**Magic Learning Toolbox** is a vibrant, interactive collection of web-based games designed specifically for early childhood education (focused on age 6+). The project aims to make learning math, logic, and language fun through gamified experiences, colorful visuals, and intuitive interactions. It is optimized for mobile use, particularly for full-screen "App" experiences on the iPhone and iPad.

---

## 🎮 Core Modules & Games

### 🧠 Thinking & Math
Focuses on logical reasoning and arithmetic skills.
- **Maths Magic (24)**: A mental math game where players use four numbers to reach the target of 24.
- **Probability Games**: (Work in Progress) Interactive modules teaching concepts like certain, impossible, and likely/unlikely.

### 📚 Words & Stories
Language and literacy development tools.
- **Magic Dictionary**: An AI-powered dictionary with definitions, voice synthesis, and visual stickers.
- **Magic Sentence Lab**: A sentence-building game with 1,600+ phrases and various themes (e.g., Peppa Pig, Bluey).

### 🎨 Just for Fun
Engaging interactive experiences for recreation.
- **Hive (Insect Chess)**: A strategic board game featuring an AI opponent with multiple difficulty levels.
- **Fireworks Launcher**: A creative visual interaction tool.

---

## 🛠️ Technology Stack
- **Frontend**: HTML5, Vanilla JavaScript (ES6+).
- **Styling**: Tailwind CSS for rapid, responsive UI development.
- **Typography**: [Fredoka](https://fonts.google.com/specimen/Fredoka) (Google Fonts) for a friendly, child-friendly look.
- **Deployment**: Hosted on **GitHub Pages**.
- **Optimization**: PWA-like features (meta tags) for "Add to Home Screen" functionality on iOS.

---

## 📁 Project Structure
```text
May_Games/
├── index.html                # Main Hub (Home Screen)
├── README.md                 # Deployment & Installation Guide
├── plan.md                   # Future roadmap & design specs
├── game_config.js            # Global configuration & module toggles
├── Just_Fun/                 # Recreational games (Hive, Fireworks)
├── Thinking_Math/            # Math & Logic modules
└── Words_Stories/            # Language & Literacy modules
```

---

## 🚀 Recent Updates (Change Log Summary)

### Dec 31
- **Hive (Insect Chess)**: Added AI with 3 difficulty levels, drag-to-pan navigation, and a redesigned floating piece UI.
- **Mobile Optimization**: Further refinements for iPhone landscape mode.

### Dec 18
- **Global Responsive Fixes**: Adapted all games for better vertical stacking on small phone screens.

### Dec 17
- **Sentence Lab**: Expanded to 7 new themes and standardized to British English.
- **Magic Dictionary**: Visual overhaul with "Magic Castle" theme and AI improvements.
- **Features**: Added "Smart Hints" to Make 24 and "Home" buttons to all games.

---

## 📱 Deployment & Usage
The project is live at [bellerswang.github.io/learning_game/](https://github.com/bellerswang/learning_game). 
- **iPhone Installation**: Open in Safari → Share → Add to Home Screen.
- **Local Config**: Modules can be toggled via `game_config.js`.
