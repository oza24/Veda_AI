# Veda_AI 🚀  
### AI-Powered Question Paper Generation Platform

Veda_AI is a full-stack AI-driven educational platform that automatically generates professional question papers using natural language prompts, uploaded documents, and AI models. The system supports dynamic section generation, MCQs, short/long answers, diagram-based questions, answer keys, PDF export, real-time generation tracking, and scalable queue processing.

---

# ✨ Features

- 🤖 AI-powered question paper generation
- 📝 Prompt-based dynamic paper creation
- 📄 PDF/document upload support
- 📚 MCQ, short, long, and diagram-based questions
- 🔑 Separate answer key generation
- 📥 Professional printable PDF export
- ⚡ Real-time progress updates using Socket.IO
- 🧠 BullMQ + Redis background job processing
- ☁️ Fully deployed cloud architecture
- 🔐 Secure environment variable handling
- 📱 Responsive modern UI

---

# 🛠️ Tech Stack

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- Socket.IO Client

## Backend
- Node.js
- Express.js
- TypeScript
- BullMQ
- Redis (Upstash)
- MongoDB Atlas
- Groq AI SDK
- Socket.IO

---

# ☁️ Deployment Architecture

```bash
Frontend  → Vercel
Backend   → Render
Database  → MongoDB Atlas
Queue     → Upstash Redis
AI Engine → Groq API
```

---

# ⚙️ Core Features

### AI Question Generation
Generate structured papers directly from prompts like:

```bash
Generate biology paper with:
- 5 MCQ questions
- 3 short answers
- 1 diagram question
```

---

### Dynamic Section Builder
Sections are automatically generated according to user instructions instead of fixed templates.

---

### Real-Time Generation
Live progress tracking using:
- BullMQ
- Redis
- Socket.IO

---

### PDF Export
- Clean printable layout
- Answer key support
- Proper exam formatting

---

# 🔒 Security

- Environment variables protected
- `.env` excluded using `.gitignore`
- Secure API architecture
- Production-ready deployment

---

# 📦 Installation

## Clone Repository

```bash
git clone https://github.com/oza24/Veda_AI.git
```

---

## Backend Setup

```bash
cd server

npm install

npm run dev
```

---

## Frontend Setup

```bash
cd client

npm install

npm run dev
```

---

# 🌐 Environment Variables

## Backend `.env`

```env
PORT=3000

NODE_ENV=development

MONGO_URI=your_mongodb_uri

REDIS_URL=your_redis_url

GROQ_API_KEY=your_groq_key

JWT_SECRET=your_secret
```

---

# 🚀 Production Deployment

### Frontend
Deploy on:
- Vercel

### Backend
Deploy on:
- Render

### Services
- MongoDB Atlas
- Upstash Redis
- Groq API

---

# 🎯 Future Improvements

- Authentication system
- Multi-user dashboard
- Teacher/student roles
- Cloud file storage
- Advanced AI evaluation
- Analytics dashboard
- Multi-language support

---

# 👨‍💻 Author

### Vilas Oza

AI/ML & Full Stack Developer  
Passionate about AI-powered educational platforms and scalable SaaS systems.

---

# ⭐ Support

If you like this project:

⭐ Star the repository  
🍴 Fork the project  
🚀 Contribute improvements
