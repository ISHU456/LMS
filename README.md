# ScholarNode - Next-Gen Secure Learning Ecosystem

ScholarNode is a high-performance, full-stack Learning Management System (LMS) built with the MERN stack. It prioritizes advanced security through biometric authentication and geofencing, while engaging users through a robust gamification engine.

---

## 🌟 Key Features

### 🔐 Advanced Security (The "Shield" Layer)
- **Biometric MFA**: Integrated Facial Recognition using `face-api.js` for secure student/teacher identity verification.
- **Geofencing & Location Check**: Real-time geolocation validation to ensure authorized access during assessments and attendance.
- **Role-Based Access Control (RBAC)**: Distinct, isolated workflows for **Admins, Teachers, Students, and Librarians**.

### 🎮 Gamification & Engagement
- **Dynamic Badge System**: Automated achievement unlocking based on user progress and performance.
- **Interactive Quizzing**: Real-time quiz engine with instant feedback and result analytics.
- **Progress Tracking**: Holistic visualization of learning journeys for students.

### 🛠 Tech Stack
- **Frontend**: React.js, Vite, Vanilla CSS (Premium Glassmorphism Design)
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB (Mongoose ODM)
- **DevOps**: Docker, Docker Compose
- **Security**: JWT, bcrypt, Face API, Geolocation API

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Docker (Optional, for containerized deployment)
- MongoDB (Atlas or Local)

### 2. Installation
Clone the repository and install dependencies from the root:
```bash
git clone https://github.com/ISHU456/LMS.git
cd ScholarNode
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

### 4. Run the Application
Start both the Frontend and Backend concurrently:
```bash
npm run dev
```

---

## 🐳 Docker Deployment
For a consistent environment, use Docker Compose:
```bash
docker-compose up --build
```

## 📁 Project Structure
- `client/`: React + Vite frontend with modular MFA components.
- `server/`: Express backend with secure controller logic and news aggregators.
- `docker/`: Deployment configurations for scaling.

---

## 👨‍💻 Author
**Ishu Anand Malviya**
[GitHub Profile](https://github.com/ISHU456)

---

> *ScholarNode was designed to bridge the gap between education and high-tier security protocols.*
