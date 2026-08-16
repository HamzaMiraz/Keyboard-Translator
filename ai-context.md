# AI Context: Chrome Extension - Smart Phonetic & Translation Engine

## 📌 Project Overview
A highly optimized, Zero-RAM Chrome extension for real-time Phonetic Typing (e.g., Banglish to Bangla) and Multi-Language Inline Translation. Built with Manifest V3.

## ⚙️ Core Architecture (World-Class Standard)
1. **Zero-RAM State Manager:** Avoids storage fetching on every keystroke. Settings are synced silently in the background via `window.SmartSettings`.
2. **Smart Cache Engine:** Uses Hash Map with a Bulk FIFO Eviction algorithm (Limit: 10,000 words). Ensures 0ms response time and prevents API IP blocking (429 Too Many Requests).
3. **Decoupled Pipeline:** Phonetic typing and Inline Translation work independently. Even if typing is toggled OFF, the translation engine intelligently parses mixed/Banglish text natively.

## 📂 File Structure & Responsibilities

*   **`manifest.json` (V3):** Handles permissions (`storage`, `activeTab`).
*   **`popup.html` & `popup.js`:** Dark-themed UI control panel. Updates `chrome.storage.local` with user preferences (Typing Toggle, Typing Lang, Translation Toggle, Translation Lang).
*   **`api.js`:** The brain of the network. 
    *   Manages Global State (`window.SmartSettings`).
    *   Handles `PhoneticCache` and `TranslationCache` (`MAX_CACHE_SIZE = 10000`).
    *   Contains `fetchTransliteration(word)` and decoupled `fetchSentenceTranslation(text)`.
*   **`main.js`:** Core Synchronous Keyboard Engine. Tracks cursor position natively and in content-editable divs. Triggers VS Code-like suggestion box instantly using cached data.
*   **`selection.js`:** Handles mouse selection text. Checks if translation is enabled and dynamically translates to the selected global language.
*   **`engine.js`:** Local fallback dictionary/engine (specifically for Bangla offline support).

## 🚀 Current Status & Checkpoint
*   **Phase 1-4 Completed:** UI, Dynamic Phonetic Engine, Global Translation with Smart Regex Bypass, and 10k Limit Cache Engine are fully implemented and stable. 
*   **Ready for Production:** No memory leaks, lag-free keystrokes, API rate-limit protected.

---
**[Prompt for AI]:** 
"Act as an expert Chrome Extension Architect. The above is the context of my current project. I will now share a specific file's code or ask you to add a new feature. Keep the 'Zero-RAM' and 'Decoupled' architecture intact in all future updates."