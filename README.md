# 📜 Study & Scroll

> **Turn doomscrolling into high-yield micro-learning.**  
> Flashcards, AI persona tutors, quiz challenges, and bite-sized notes delivered in an addictive social feed format.

---

## ✨ Features

- **📱 Addictive Micro-Learning Feed**: Study cards presented like social media posts, threads, and polls.
- **🤖 Live AI Persona Tutors**: Powered by **Google Gemini 3 Flash** (`gemini-3-flash`):
  - 💀 **@brainrot_scholar**: Relatable analogies and humor that makes hard concepts stick.
  - 🧵 **@deepdive_dan**: Structured, high-yield numbered threads breaking down multi-step mechanisms.
  - 🎭 **@aita_academics** & **@hot_take_prof**: Engaging scenarios and provocative debates.
  - ❓ **@pop_quiz_bot**: Active recall multiple-choice quizzes with instant answer feedback and explanations.
- **💬 Interactive Follow-Up Questions**: Ask any persona a question in the comment section and receive in-character, academically accurate AI replies.
- **📑 Multi-Format Notes Upload**: Upload PDF files, Markdown, or plain text lecture notes — Gemini analyzes the content and instantly synthesizes customized study feeds.
- **🔥 Gamified Retention**: Track your study streak, like high-yield takeaways, and bookmark essential cards for offline review.
- **🎨 Dual Theme Aesthetics**: Switch seamlessly between **Obsidian Dark Mode** and warm **Parchment Light Mode**.
- **⚡ In-App API Key Testing**: One-click connection test in the Settings modal (⚙️) with live Google API health checks.
- **🛡️ Hybrid Cloud & Local Storage**: 100% functional out of the box with browser `localStorage`, with optional Firebase Auth & Firestore sync.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) with custom parchment & gold palettes
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [Google Gemini 3 Flash](https://aistudio.google.com/) via Generative Language API
- **Cloud Backend (Optional)**: [Firebase 11](https://firebase.google.com/) (Auth & Firestore)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or newer)
- A free [Google AI Studio API Key](https://aistudio.google.com/) (optional, offline curated mode works without a key)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nimssbeep/Study-and-Scroll.git
   cd Study-and-Scroll
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and add your Gemini API key (optional):
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_MODEL=gemini-3-flash
   ```
   *(You can also paste your API key directly inside the app's Settings modal ⚙️ at runtime).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Scripts

- `npm run dev`: Starts the local development server with Hot Module Replacement (HMR).
- `npm run build`: Bundles the production-ready application into the `dist/` folder.
- `npm run preview`: Previews the production build locally.

---

## 🔒 Security & Privacy

Your private keys and sensitive credentials are protected:
- `.env` and local environment files are ignored by `.gitignore`.
- `.env.example` contains only public template placeholders.
- API keys entered via the in-app Settings modal are stored strictly in your browser's private `localStorage`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
