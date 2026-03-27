# SmartLMS - Secure & Isolated Workspace

This project is set up as a **Node.js Workspace** to ensure it remains isolated from other projects on your machine.

## 🚀 Getting Started

1. **Install Dependencies** (from the root folder):
   ```bash
   npm install
   ```
   *This installs root tools like `concurrently` and handles client/server dependencies.*

2. **Environment Setup**:
   - Check `server/.env` and ensure it matches `server/.env.example`.
   - The `FRONTEND_URL` in the server's `.env` ensures that the backend only communicates with your local SmartLMS frontend.

3. **Run the Project**:
   ```bash
   npm run dev
   ```
   *This starts both the backend (Port 5000) and frontend (Port 5173) simultaneously using a single terminal command.*

## 🔒 Security Features Added
- **CORS Restriction**: Backend is now locked to only allow the frontend origin (defaults to `http://localhost:5173`).
- **Workspace Isolation**: No global npm packages are required.
- **Port Management**: Standard ports are used but are configurable via `.env`.
- **Secrets Management**: Sensitive keys are kept in `.env` and are git-ignored.

## 📁 Project Structure
- `client/`: React + Vite frontend.
- `server/`: Node.js + Express + Socket.io backend.
