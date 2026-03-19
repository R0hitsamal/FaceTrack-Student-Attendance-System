# FaceTrack — Face Recognition Attendance System

A full-stack MERN + Python attendance system using real-time face recognition.

## 🗂 Project Structure

```
facetrack/
├── frontend/          # React.js (Vite)
├── backend/           # Node.js + Express + MongoDB
└── python-service/    # Python face recognition microservice
```

## ⚡ Quick Start

### 1. Backend (Node.js)
```bash
cd backend
npm install
cp .env.example .env      # fill in your MONGO_URI and JWT_SECRET
npm run dev
```

### 2. Python Service
```bash
cd python-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Ports
| Service | Port |
|---|---|
| React Frontend | 5173 |
| Node/Express API | 5000 |
| Python Face Service | 8000 |

## 🔑 Default Admin Login
- Email: `admin@facetrack.com`
- Password: `Admin@123`

## 🛠 Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, Recharts |
| Backend | Node.js, Express, JWT, Mongoose |
| Database | MongoDB Atlas | | Python, FastAPI, OpenCV |
| Styling | Custom CSS (no framework) |

## 📡 API Overview

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Students
- `GET /api/students`
- `POST /api/students` (with face image)
- `PUT /api/students/:id`
- `DELETE /api/students/:id`

### Attendance
- `GET /api/attendance`
- `GET /api/attendance/today`
- `GET /api/attendance/report?from=&to=&studentId=`

### Python Service
- `POST /recognize` — accepts base64 frame, returns matched student id
- `POST /register-face` — stores new face encoding

## 🔒 Environment Variables

### backend/.env
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret
JWT_EXPIRES_IN=7d
PYTHON_SERVICE_URL=http://localhost:8000
```

### frontend/.env
```
VITE_API_URL=http://localhost:5000/api
VITE_PYTHON_URL=http://localhost:8000
```
