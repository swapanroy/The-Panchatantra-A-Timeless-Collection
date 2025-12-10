# Panchatantra Tales - Kaggle Submission

**Tagline:** Reimagining ancient wisdom with modern AI. An infinite, interactive storybook engine for children.

## The Challenge
In a digital age, children often consume passive content that lacks educational value. Traditional moral stories, like the Panchatantra, are timeless but can feel outdated to modern kids. Furthermore, static books offer a finite experience—once read, the engagement ends. We wanted to bridge this gap by creating an app that offers **infinite**, personalized moral education.

## The Solution
**Panchatantra Tales** is a web application that brings classic fables to life—and lets kids create new ones—using Google's Gemini API. It transforms text into a rich, read-along experience with:
- **AI-Generated Illustrations**: Visualizing scenes in real-time.
- **Narrative Text-to-Speech**: Soothing voiceovers for accessibility and engagement.
- **Infinite Story Engine**: A tool to generate brand new fables based on user-selected characters.

## Key Features

### 1. 📖 Classic & Custom Stories
- **Classic Collection**: Curated, pre-loaded tales with defined morals.
- **Create Your Own**: Users enter a Main Character (e.g., "A brave Pig"), a Friend/Enemy ("A wise Owl"), and a Setting. Gemini 2.5 generates a unique 5-scene fable with a moral lesson in seconds.

### 2. 🎨 Multimodal Immersion
- **Visuals**: Consistent, 3D-animation style illustrations generated on the fly.
- **Audio**: Instant Text-to-Speech narration using the 'Kore' voice.
- **Text**: Kid-friendly fonts and large typography.

### 3. 💾 Personal Library (Freemium Model)
- **Save Creations**: Users can save up to 4 custom stories to their local library.
- **Manage**: A dedicated management tab to reorder stories, delete old ones, or hide default tales.
- **Upgrade Flow**: A mock paywall ($1/mo) demonstrates how this could be monetized when storage limits are reached.

### 4. ⚡ Zero-Latency Performance
- **Smart Caching**: Generated media is cached in-memory. Revisiting a page is instant.
- **Parallel Prefetching**: The moment a story is selected, the app begins generating assets for the first few scenes in the background.

## Technical Architecture

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: React Hooks + LocalStorage for persistence.

### AI Integration (Google Gemini API)
We utilize the `@google/genai` SDK to power the core features:

1.  **Story Generation (Reasoning)**: `gemini-2.5-flash`
    *   We use **JSON Schema Enforcement** to ensure the AI returns a strictly structured JSON object containing: Title, Lesson, and exactly 5 Scenes (Narrative + Image Prompts).
2.  **Visuals**: `gemini-2.5-flash-image`
    *   Generates consistent, square aspect-ratio images based on the prompts derived from step 1.
3.  **Audio**: `gemini-2.5-flash-preview-tts`
    *   Converts narrative text into raw PCM audio, which we encode to WAV on the client side for playback.

### Storage Strategy
To respect browser storage quotas (~5MB):
- We **do not** save base64 images or audio blobs to LocalStorage.
- We only save the **Text Structure** (Title, Scenes, Prompts) of custom stories.
- When a saved story is opened, the app re-generates or re-fetches media on demand, keeping the storage footprint negligible.

## How to Run
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set your API Key in the environment variables:
    ```bash
    export API_KEY=your_gemini_api_key
    ```
4.  Run the development server:
    ```bash
    npm start
    ```
5. Direct URL : https://aistudio.google.com/apps/drive/1z7dO2wSDrkd80kVoMYW-axlE7sbDCQ1k?showAssistant=true&resourceKey=&showCode=true
## Future Roadmap
- **Voice Input**: Allow kids to dictate their story ideas instead of typing.
- **Multi-language Support**: Translate stories and audio into Hindi, Spanish, and French on the fly.
- **Character Consistency**: Use advanced prompting or LoRA adapters to keep the "Main Character" visually identical across all 5 scenes.

---
*Built for the Google AI Hackathon by Swapan Roy.*
