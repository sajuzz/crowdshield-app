# CrowdShield AutoOps 🛡️

Hey there! Welcome to **CrowdShield AutoOps**. This is an MVP I built to validate a totally new way to handle stadium operations, crowd safety, and live communication during massive events (like an IPL match). 

Instead of security guards staring at static maps or using walkie-talkies, CrowdShield acts as a real-time, autonomous "brain" for the stadium. It syncs live crowd density, automatically flags congested gates, and even dispatches security to incidents without human intervention. 

## 🚀 Check it out live
I've deployed the current MVP to Google Cloud Run so you can play with it immediately:
**Production URL:** https://crowdshield-app-592636859313.asia-south1.run.app

*(Want to see the Admin side? Use the password `admin123` to log into the Operations Panel)*

---

## 🛠️ How I built this (The Tech Stack)

To make a live stadium app work, latency has to be basically zero. Here's the stack I chose to make that happen:

### **The Frontend**
- **React + Vite**: I used Vite because I wanted lightning-fast HMR during development, and React makes handling the complex live state a breeze.
- **Socket.io-Client**: This is the magic. It keeps a persistent WebSocket tunnel open to the server, so the second a gate gets crowded, the UI updates instantly. No polling!
- **Vanilla CSS**: I skipped heavy component libraries (like Material UI or Bootstrap) and wrote a custom design system from scratch. It uses a sleek dark-mode aesthetic with glassmorphism to look like a premium, modern command center.

### **The Backend**
- **Node.js & Express**: Keeps the API layer extremely lightweight.
- **Socket.io (Server)**: This acts as our grand orchestrator. It handles the bi-directional blasts of data between the admin panels and the thousands of connected attendee dashboards.
- **Autonomous Rule Engine**: I wrote a custom engine that listens to "sensor" data. If a zone hits 90% capacity, the engine automatically fires off a trigger to update the UI and log an autonomous dispatch event.

### **Data & DevOps**
- **Firebase / Firestore (Mocked)**: Right now, I'm using a local mock service that mirrors a NoSQL structure so we don't rack up cloud database costs while validating the MVP, but it's architected to drop in real Firestore seamlessly later.
- **Docker + Google Cloud Run**: The whole app (frontend and backend) is bundled into a single unified Nginx/Express container and deployed on serverless Cloud Run. It sleeps when nobody is using it, but can auto-scale instantly if 50,000 fans hit the app at the end of a match.

---

## 🏗️ How the Data Flows

The architecture relies on a strict, unidirectional real-time loop:

1. **The Source of Truth**: The backend holds the master `stadiumState`. It knows the exact wait time at Gate A, the current weather, the live IPL match score, and if there are any active emergencies.
2. **The Broadcast**: Anytime state changes (whether an admin clicks a button or the autonomous engine triggers a rule), the backend blasts a `state-update` event down the WebSockets.
3. **The Admin Ops Panel**: This is the command center. Admins can report medical incidents, manually override crowd levels, update the live cricket score, or broadcast a global message (e.g., "Gate C is open") to everyone in the stadium.
4. **The Attendee Dashboard**: This is the public view. It is strictly a "dumb" read-only client. It just sits there, listens to the WebSocket, and instantly changes colors or shows emergency banners the second the backend tells it to.

---

## 🌟 The Coolest MVP Features

* **Live IPL Scoreboard**: Fans don't need to switch between our app and Cricbuzz. The live score sits right at the top of their dashboard.
* **Autonomous Engine Simulation**: If you watch the Admin logs, you'll see the system "thinking" and acting on its own when crowd density spikes.
* **Explicit Crowd Indicators**: The UI doesn't just show numbers; it literally tells fans `(High Crowd)` or `(Normal)` in red/green so they instantly know which concession stand to walk to.
* **Zero-Refresh Broadcasts**: An operator hits "Send Broadcast" and thousands of phones in the stadium instantly pop up the message.

---

## 💻 Running it on your own machine

Want to poke around the code and run it locally? It's super simple.

### 1. Grab the code
```bash
git clone https://github.com/sajuzz/crowdshield-app.git
cd crowdshield-app
```

### 2. Boot the Backend
```bash
cd backend
npm install
npm run dev
```
*(The backend server will spin up on `http://localhost:3000`)*

### 3. Boot the Frontend
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
*(Your frontend will be live at `http://localhost:5173`)*

---

*This MVP proves out the hardest part: the real-time software architecture. Next steps? Hooking this bad boy up to physical IoT turnstiles and thermal density cameras!*
