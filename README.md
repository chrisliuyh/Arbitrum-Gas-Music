# 🎵 Arbitrum Gas Music Visualizer (Arb Pulse)

Live Demo: https://arbitrum-gas-music.pages.dev/

**Arb Pulse** is an interactive data sonification experiment that transforms the heartbeat of the Arbitrum blockchain into an audio-visual experience. 

## ✨ Key Features

### 1. Data Sonification Engine
*   **7-Day History:** Fetches the last 168 hours of data from the Arbitrum One network via RPC.
*   **Smart Activity Detection:** Automatically switches between "Gas Price" (L1 Fees) and "Gas Used" (L2 Congestion) to ensure dynamic melodies even when L2 fees are flat (0.01 Gwei).
*   **Web Audio Synth:** A custom-built synthesizer using the Web Audio API (no external audio libraries).

### 2. Interactive Control Deck
*   **3 Sound Engines:**
    *   **Cyberpunk:** Aggressive Sawtooth waves with low-pass filters.
    *   **Ethereal:** Ambient Sine/Triangle pads for a zen experience.
    *   **Retro:** 8-bit Square wave Chiptune style.
*   **Tempo Control:** Adjust playback speed from a slow drone (1s/block) to a fast arpeggiator (0.05s/block).

### 3. Visual Experience
*   **3D Ribbon Visualization:** High-performance Canvas rendering of data points with dynamic gradients.
*   **Glassmorphic UI:** A sleek, dark-mode "Command Center" interface designed for immersion.
*   **Real-time Playhead:** Laser cursor tracking the exact moment of blockchain history being played.

### 4. Artifact Generation (Export)
*   **🎵 Audio Export (WAV):** Renders the generated melody faster-than-realtime into a high-quality `.wav` file.
*   **🖼️ Image Export (PNG):** Captures a high-resolution snapshot of the data visualization.
*   **💎 NFT Metadata:** Generates standard ERC-721 JSON metadata including:
    *   Procedural SVG cover art.
    *   AI-powered poetic descriptions (via Google Gemini).
    *   On-chain traits (Average Gas, Duration, Style).

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **Audio:** Native Web Audio API (`OscillatorNode`, `BiquadFilterNode`, `OfflineAudioContext`)
*   **Graphics:** HTML5 Canvas API
*   **Blockchain:** Arbitrum JSON-RPC
