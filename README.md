# Nexa Auth - AI-Powered Authentication Platform

A modern full-stack authentication application with AI integration using Groq API.

## 🚀 Features

- **Modern UI**: Futuristic glassmorphism design with Tailwind CSS
- **Authentication**: Secure JWT-based auth with MongoDB
- **Floating AI Bubble**: Draggable AI assistant with chat, summarize, and more
- **Groq Integration**: AI-powered features via Groq API
- **Responsive Design**: Mobile-friendly interface

## 📁 Project Structure

```
nexa-auth-groq/
├── backend/          # Node.js + Express + MongoDB
├── frontend/         # React + Vite + Tailwind CSS
└── README.md
```

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Groq API Integration
- bcryptjs for password hashing

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- Axios

## 🚀 Deployment

### Backend (Render)
1. Push to GitHub
2. Connect Render to your repository
3. Set environment variables in Render dashboard:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `GROQ_API_KEY`
   - `PORT` (optional, defaults to 4000)

### Frontend (Vercel)
1. Push to GitHub
2. Import project in Vercel
3. Set environment variable:
   - `VITE_API_URL` (your Render backend URL + `/api`)
4. Deploy

## 💻 Local Development

### Backend Setup
```bash
cd backend
npm install
# Create .env file with required variables
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with VITE_API_URL
npm run dev
```

## 🔐 Environment Variables

### Backend `.env`
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=4000
GROQ_API_KEY=your_groq_api_key
GROQ_API_URL=https://api.groq.com
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:4000/api
```

## 📝 License

MIT

## 👨‍💻 Author

Vaibhav Patel
