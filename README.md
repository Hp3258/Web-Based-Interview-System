<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="ExpressJS" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</div>

<h1 align="center">🎯 Code Together - Web Based Interview System</h1>

<p align="center">
  A highly advanced, real-time technical interview platform equipped with live collaborative coding, video calling, code execution, AI-powered proctoring, and live transcription.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#installation">Installation</a> •
  <a href="#environment-variables">Environment Variables</a>
</p>

---

## ✨ Features

- **💻 Collaborative Code Editor:** Real-time code synchronization between HR and the candidate (powered by Monaco Editor).
- **🚀 Live Code Execution:** Compile and run code instantly in multiple languages using the Judge0 API.
- **🎥 Video & Audio Calling:** High-quality integrated video calls powered by Stream API.
- **🤖 AI Proctoring System:** Intelligent monitoring detecting tab switches, fullscreen exits, mobile phone usage, and gaze deviation to ensure integrity.
- **🎙️ Live Transcription:** Real-time speech-to-text during the interview powered by Deepgram.
- **📧 Automated Email Invites:** Beautifully designed HTML email invites sent directly to candidates (bypassing strict SMTP blocks via Vercel Serverless functions).
- **🔒 Secure Authentication:** Handled seamlessly by Clerk.

## 📸 Screenshots

*(Replace the image paths below once you add your screenshot files to the repository!)*

### 1. Dashboard (HR View)
> View all upcoming and past interview sessions.
<img src="./assets/dashboard.png" width="800" alt="Dashboard Screenshot" />

### 2. Active Interview Session (Collaborative Editor & Video)
> Real-time coding interface alongside video communication.
<img src="./assets/active-session.png" width="800" alt="Active Session Screenshot" />

### 3. AI Proctoring & Alerts (Candidate View)
> Strict fullscreen enforcement and AI behavior tracking.
<img src="./assets/proctoring.png" width="800" alt="Proctoring Screenshot" />

### 4. Email Invitation
> The HTML invite email the candidate receives.
<img src="./assets/email-invite.png" width="800" alt="Email Invite Screenshot" />

---

## 🛠 Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS & DaisyUI
- Monaco Editor (Code Editor)
- Clerk (Authentication)
- Stream Video/Chat SDK

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- Nodemailer (Proxy via Vercel)
- Judge0 API (Code Execution)
- Deepgram API (Live Transcription)

---

## 🚀 Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Hp3258/Web-Based-Interview-System.git
cd Web-Based-Interview-System
```

### 2. Setup the Backend
```bash
cd backend
npm install
npm start
```

### 3. Setup the Frontend
```bash
cd frontend
npm install
npm run dev
```

---


## 🚀 Deployment Architecture

- **Frontend:** Deployed on [Vercel](https://vercel.com/) (handles standard hosting + the serverless email API function).
- **Backend:** Deployed on [Render](https://render.com/) (runs the Express.js Web Service).

> **Note on Email:** Because Render blocks outbound SMTP (Port 587) on its free tier, the email sending logic is proxied through a Vercel Serverless Function located at `frontend/api/send-email.js`.

---

<div align="center">
  Built with ❤️ by Harish Pawar
</div>
