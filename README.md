# Panchatantra Tales - Kaggle Submission

**Tagline:** Reimagining ancient wisdom with modern AI. An interactive, multimodal storybook for children.

## The Challenge
In a digital age, children often consume passive content that lacks educational value. Traditional moral stories, like the Panchatantra, are timeless but can feel outdated to modern kids. We wanted to bridge this gap by making moral education engaging, interactive, and personalized without increasing passive screen time.

## The Solution
**Panchatantra Tales** is a web application that brings classic fables to life using Google's Gemini API. It transforms static text into a rich, read-along experience with:
- **AI-Generated Illustrations**: Visualizing scenes in real-time.
- **Narrative Text-to-Speech**: Soothing voiceovers for accessibility and engagement.
- **Instant Playback**: Smart caching and pre-fetching for a seamless user experience.

## Key Features
- **Multimodal Storytelling**: Combines text, audio (TTS), and visuals (Image Gen) seamlessly.
- **Kid-Friendly UI**: Simple navigation, large text, and colorful, engaging design optimized for tablets and desktops.
- **Zero-Latency Feel**: Implements aggressive pre-fetching and parallel processing strategies to ensure stories play instantly.
- **Moral Lessons**: Every story concludes with a distinct lesson to ensure educational value.

## Technical Architecture

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide React

### AI Integration (Google Gemini API)
We utilize the `@google/genai` SDK to power the core features:
1.  **Visuals**: `gemini-2.5-flash-image` generates consistent, 3D-animation style illustrations for each scene.
    *   *Prompt Engineering*: "cute 3d animation style, pixar style, soft lighting" appended to scene descriptions.
2.  **Audio**: `gemini-2.5-flash-preview-tts` converts narrative text into high-quality speech.
    *   *Voice*: Using the 'Kore' prebuilt voice for a soothing, story-telling tone.

### Performance Optimizations
- **Parallel Generation**: Image and Audio requests for current and upcoming scenes are fired concurrently using `Promise.all` patterns.
- **In-Memory Caching**: A custom `mediaCache` service stores generated assets (Base64 images and Blob URLs). Revisiting a page or story requires zero API calls.
- **Pre-fetching**: Media generation starts the moment a story is selected, often completing before the user clicks "Start Reading".

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

## Future Roadmap
- **Custom Stories**: Allow kids to create their own avatars and star in the fables.
- **Multi-language Support**: Translate stories and audio into Hindi, Spanish, and French using Gemini's translation capabilities.
- **Interactive Quizzes**: Simple questions at the end to test comprehension.

---
*Built for the Google AI Hackathon by Swapan Roy.*
