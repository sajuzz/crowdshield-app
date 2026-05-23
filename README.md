# CrowdShield AutoOps 🛡️

CrowdShield AutoOps is a real-time, autonomous stadium operations and crowd-management platform designed to proactively manage venue safety, crowd density, and attendee communication. This project was built to validate the MVP for next-generation automated stadium operations, featuring live data synchronization and autonomous incident resolution.

## 🚀 Live Demo
The application is currently deployed to Google Cloud Run.
**Production URL:** https://crowdshield-app-592636859313.asia-south1.run.app

*(Note: Admin login requires the password `admin123`)*

---

## 🛠️ Tech Stack
The platform uses a modern, real-time technology stack:

### **Frontend**
- **React.js** (via Vite): For high-performance, dynamic user interfaces.
- **Socket.io-Client**: To maintain a persistent WebSocket connection for millisecond-latency live updates.
- **Vanilla CSS**: Custom design system built from scratch prioritizing dark-mode aesthetics, responsive glassmorphism, and live dynamic color-coding based on crowd density.

### **Backend**
- **Node.js & Express**: Lightweight, fast API routing.
- **Socket.io (Server)**: Real-time event orchestration, handling bi-directional communication between the stadium hardware/admins and attendees.
- **Custom Rule Engine**: Autonomous event processors that trigger localized system actions (e.g., dispatching security, shutting down a gate, projecting alerts) based on mock sensor data.

### **Database / Persistence**
- **Firebase / Firestore Database** *(Currently running via a Local Mock Service for MVP speed/cost optimization)*: Centralized NoSQL database designed for live state propagation.

### **DevOps & Deployment**
- **Docker**: Containerized into a unified Nginx/Express hybrid container.
- **Google Cloud Run**: Serverless production hosting ensuring auto-scaling capabilities under high load (e.g., when a match ends).

---

## 🏗️ Architecture & Data Flow
The system operates on a unidirectional, real-time data propagation model:

1. **State of Truth (The Backend)**: The `stadiumState.js` acts as the single source of truth, managing:
   - Live wait times and density per zone.
   - Global match state (Weather, IPL Match Score, Mode).
   - Active Incidents and Emergencies.
2. **The Socket Tunnel**: Whenever the backend state is mutated (by an admin action or the autonomous engine), the `socketManager` broadcasts a `state-update` event to all connected clients.
3. **Admin Dashboard (Command Center)**:
   - Admins dispatch manual incidents (e.g., "Report MEDICAL incident at Gate A").
   - Admins can broadcast messages to all attendees.
   - Admins can update the global IPL match score.
   - Actions are emitted back to the server via WebSockets (`admin-action`).
4. **Attendee Dashboard (Public View)**:
   - Operates entirely as a **read-only consumer**.
   - Receives state updates and instantly visually reflects the live wait times, scoreboard, and emergency banners to redirect foot traffic.

---

## 🌟 Key MVP Features

* **Real-time IPL Scoreboard**: Keeps attendees engaged without having to check secondary sports apps.
* **Autonomous Rule Engine**: Simulates what happens when a zone hits 90% capacity—the system automatically dispatches security and flags the zone as CRITICAL.
* **Live Crowd Density Indicators**: Explicit visual gauges (`High Crowd` vs `Normal`) that tell attendees exactly which gates and concessions are currently congested.
* **Instant Broadcast Messaging**: The ability for operators to beam a message (e.g., "Gate C is now open") to thousands of phones instantly without page refreshes.
* **RBAC & Security**: Strict separation between the public attendee view and the authenticated Admin Operations Panel.

---

## 💻 How to Run Locally

If you want to spin up the MVP locally for development:

### 1. Clone the repository
```bash
git clone https://github.com/sajuzz/crowdshield-app.git
cd crowdshield-app
```

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```
*(The backend will run on `http://localhost:3000`)*

### 3. Start the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*(The frontend will run on `http://localhost:5173`)*

---

*This MVP validates the technical feasibility of real-time stadium operations and serves as the architectural foundation for integrating physical IoT turnstiles and thermal density cameras in the future.*
