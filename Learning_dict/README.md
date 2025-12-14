# ✨ Magic Learning Dictionary

A bilingual, kid-friendly interactive dictionary web application designed for a 6-year-old. It combines a curated local list of "magic words" with the power of the internet to define, translate, and illustrate any word.

## 🎯 Project Goal
To create an engaging tool for learning English and Chinese vocabulary, featuring large text, audio pronunciation, and fun illustrations.

## 🛠️ Technologies
- **HTML5**: Semantic structure.
- **CSS3**: Custom "Magic" theme with animations, responsive design, and kid-friendly typography (`Comic Neue`, `Fredoka`).
- **JavaScript (ES6+)**: Logic for search, API integration, DOM manipulation, and Text-to-Speech.

## 🌟 Key Features

### 1. Hybrid Search System 🔍
- **Local "Magic" Dictionary**: Instant results for curated words (e.g., Apple, Cat, Rainbow) with custom, age-appropriate explanations.
- **Online Super Power**: If a word isn't in the local list, the app fetches data from:
    - **Dictionary API**: For English definitions.
    - **MyMemory API**: For Chinese translations.
    - **Pollinations.ai**: To generate cute, cartoon-style illustrations on the fly.

### 2. Bilingual Learning 🇨🇳 🇺🇸
- Displays **English** meaning and **Chinese** translation.
- **Text-to-Speech**: Click the speaker icons 🔊 to hear native pronunciation in both languages.

### 3. Visual & Interactive 🎨
- **Big Character Mode**: A popup modal showing the full Chinese word in a massive font for writing practice.
- **Dynamic Images**: Every word gets a picture (either curated or AI-generated).
- **Fun Facts**: Simple "Did you know?" explanations.

## 📂 Project Structure
- `index.html`: Main application layout.
- `style.css`: All styling, animations, and responsive rules.
- `script.js`: Application logic, API handling, and event listeners.
- `data.js`: The local database of curated words.

## 🚀 How to Run
Simply open `index.html` in any modern web browser (Chrome, Edge, Safari). No installation or server required!
