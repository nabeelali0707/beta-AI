# Beta‑AI Digital Forensics Platform

## 📖 Overview

**Beta‑AI** is a full‑stack web application that combines a **Next.js** front‑end (React, TailwindCSS) with a **FastAPI** back‑end (Python, Pydantic v2).  
It provides:
- AI‑generated text detection and plagiarism analysis
- Real‑time summarisation and pattern‑recognition
- Persistent SQLite storage for user history (saved across container restarts)

The project is packaged with **Docker Compose** for an isolated, reproducible development environment.

---

## ✨ Key Features

- **Responsive UI** built with TailwindCSS, custom fonts, and glass‑morphism styling.
- **FastAPI** powered REST API with automatic OpenAPI documentation (`/docs`).
- **Pydantic v2** data validation and settings management.
- **SQLite** persistence via a named Docker volume (`dev_sqlite_volume`).
- **Docker‑Compose** orchestration – single command to spin up the entire stack.

---

## 🏗️ Architecture

```
project-root/
├─ backend/          # FastAPI service
│   ├─ app/          # API routes, models, utils
│   ├─ Dockerfile    # Builds the Python image
│   └─ requirements.txt
├─ frontend/nextjs/  # Next.js SPA
│   ├─ app/          # Next.js 13+ app router
│   ├─ public/       # Static assets (favicon, images)
│   ├─ Dockerfile    # Builds the Node image
│   └─ .env          # Environment variables (auto‑loaded by Docker)
├─ docker-compose.yml
└─ README.md
```

---

## 🚀 Quick Start (Docker)

> **Prerequisite** – Docker Desktop (or Docker Engine) must be installed and the `docker` CLI available in your `PATH`.

```bash
# 1️⃣ Clone the repo (or pull your existing copy)
git clone https://github.com/your‑user/beta‑ai.git
cd beta‑ai

# 2️⃣ Create a .env file (see the "Environment Variables" section) – a template is provided in the repo.
cp .env.example .env   # edit the placeholders as needed

# 3️⃣ Spin up the stack – this wipes any stale anonymous volumes and rebuilds everything.
#    The command is safe to run repeatedly.

docker compose down -v && docker system prune -f && docker compose up --build
```

The services will become available at:
- **Frontend** – <http://localhost:3000>
- **Backend API docs** – <http://localhost:8001/docs>

---

## 🔧 Environment Variables

Both services share a single `.env` file located at the project root.  The file is loaded by Docker (`env_file: .env` in `docker‑compose.yml`).  Example template (`.env.example`):

```dotenv
# ---- FastAPI (backend) ----------------------------------------------------
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=your‑anon‑key
# SQLite DB – **do not modify** unless you change the volume mount.
DATABASE_URL=sqlite+aiosqlite:///app/db_data/test.db

# ---- Next.js (frontend) ---------------------------------------------------
# Public variables must be prefixed with NEXT_PUBLIC_ to be exposed to the browser.
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
# Optional extra keys for your UI
NEXT_PUBLIC_SOME_API=https://api.example.com
```

> **Important** – Missing or miss‑spelled variables will cause the application to crash with a 500 error.

---

## 💻 Development (without Docker)

If you prefer to run the services locally:

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn run:app --reload --port 8001
```

### Frontend
```bash
cd frontend/nextjs
npm install
npm run dev   # runs on http://localhost:3000
```

Make sure the `.env` file is present in the project root so both processes can read the same values.

---

## 🧪 Testing

The repo includes a minimal test suite for the FastAPI service (using `pytest`). Run it with:

```bash
cd backend
pytest
```

Frontend components can be tested with Next.js’ built‑in Jest setup (if added later).

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/awesome‑feature`).
3. Ensure the stack builds and the tests pass.
4. Open a Pull Request with a clear description of the change.

All contributions must adhere to the existing coding style and include appropriate unit/integration tests.

---

## 📄 License

This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---

*Happy hacking!*
