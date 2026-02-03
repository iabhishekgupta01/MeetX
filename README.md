# 🎥 meetX – Group Video Calling Platform

meetX is a WebRTC-based group video calling web application designed for real-time communication with a strong focus on **meeting recording and download functionality**.

The project implements core video conferencing features such as audio/video calling, screen sharing, and local meeting recording, while also preparing an extensible architecture for future accessibility and AI-powered enhancements.

meetX is actively under development and built for learning, experimentation, and real-world conferencing use cases.

---

## 🚀 Key Features

### ✅ Implemented
- Group video and audio calling using WebRTC
- Secure peer-to-peer media streaming
- Join and leave meeting rooms
- Microphone mute / unmute
- Camera on / off
- Screen sharing (entire screen, window, or tab)
- **Meeting recording with download support**
- Local recording using MediaRecorder API
- Real-time signaling using Socket.io
- Responsive and modern UI

### 🚧 In Progress / Planned
- Live captions (speech-to-text)
- Downloadable meeting transcripts
- AI-assisted sign language detection
- Screen video to audio narration
- Text-to-speech accessibility features
- AI-based meeting summaries and insights

> ⚠️ Note: Features listed as “planned” are not fully implemented yet. UI components and architectural groundwork are prepared.

---

## 🎯 Main Highlight – Meeting Recording & Download

meetX allows users to:
- Record ongoing meetings
- Capture visible meeting content (participants, UI, screen share)
- Automatically download recordings as `.webm` files
- Use browser-native MediaRecorder API for reliable recording

This makes meetX suitable for:
- Online classes
- Team meetings
- Interviews
- Academic demonstrations

---

## 🛠️ Technology Stack

### Frontend
- React.js
- WebRTC APIs
- Socket.io-client
- Material UI (MUI)

### Backend
- Node.js
- Express.js
- Socket.io

### Browser APIs
- MediaDevices API
- MediaRecorder API
- getDisplayMedia API
- Web Speech API (planned)

---

## 🔒 Security & Privacy

- WebRTC provides encrypted peer-to-peer media streams
- Secure WebSocket signaling
- HTTPS / WSS recommended for production
- No server-side recording without user consent
- Media permissions fully controlled by the user

---

## 📊 Performance Notes

- Optimized for small to medium-sized groups
- Recording handled locally for reliability
- Screen sharing does not require reconnection
- Future plans include bandwidth optimization and audio-only mode

---

## 📌 Project Status

- Core video calling: Stable
- Screen sharing & recording: Functional
- Accessibility features: In progress
- AI integrations: Planned

This repository is under active development.

---

## 📄 Disclaimer

Some advanced features shown in the UI are placeholders and represent future functionality. They are included to demonstrate planned system architecture and user experience design.

---

## 📜 License

This project is intended for educational and learning purposes.
