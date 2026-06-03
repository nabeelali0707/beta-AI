# Beta-AI Backend - Setup & Configuration Guide

## Quick Start

### 1. Local Development

```bash
cd ai-detector/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

API will be available at `http://localhost:8001`  
Swagger docs: `http://localhost:8001/docs`

### 2. Docker Development

From project root:

```bash
docker-compose up --build
```

Backend: `http://localhost:8001`  
Frontend: `http://localhost:3000`

### 3. Production Deployment

#### Via Heroku

```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret \
  SUPABASE_URL=your-url \
  SUPABASE_ANON_KEY=your-key \
  SUPABASE_SERVICE_ROLE_KEY=your-key
git push heroku main
```

#### Via AWS/GCP/Azure

Use the provided Dockerfile:

```bash
docker build -t beta-ai-backend ai-detector/backend
docker run -p 8001:8001 --env-file .env beta-ai-backend
```

---

## Supabase Setup

### Step 1: Create Project

1. Visit https://supabase.com
2. Create new project (PostgreSQL)
3. Wait for provisioning

### Step 2: Get Credentials

In Supabase dashboard:

1. **Settings → API**
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `anon public` key → `SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

2. **Settings → Auth**
   - Copy `JWT Secret` → `SUPABASE_JWT_SECRET`

### Step 3: Database Setup

In Supabase SQL Editor, run:

```bash
# Copy contents of database_schema.sql and execute
```

Or via command line:

```bash
psql -h [host] -U postgres -d postgres -f database_schema.sql
```

### Step 4: Storage Setup

In Supabase Storage:

1. Create new bucket: `beta-ai-files`
2. Set privacy: **Private**
3. Enable file size limit: 50MB

### Step 5: Authentication

In Supabase Auth:

1. Enable Email/Password provider
2. Set redirect URL: `http://localhost:3000/auth/callback`
3. Configure SMTP (optional)

---

## Environment Variables

### Development (.env)

```env
ENVIRONMENT=development
DATABASE_URL=sqlite+aiosqlite:///./test.db
JWT_SECRET=dev-secret-key-change-in-production
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
OPENAI_API_KEY=
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:8001"]
```

### Production (.env)

```env
ENVIRONMENT=production
DATABASE_URL=postgresql://postgres.ttymppqnkikzysfawawl:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=your-very-secret-key-min-32-chars
SUPABASE_URL=https://ttymppqnkikzysfawawl.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=["https://yourdomain.com"]
MAX_UPLOAD_SIZE_MB=50
```

---

## Project Structure

```
ai-detector/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry
│   ├── config.py               # Settings & configuration
│   ├── dependencies.py         # Shared dependencies
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT & password hashing
│   │   └── logging.py          # Logging setup
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py             # SQLAlchemy Base
│   │   ├── models.py           # ORM models (User, Analysis, File)
│   │   └── session.py          # Database session & connection
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py             # /auth/* endpoints
│   │   ├── analysis.py         # /analysis/* endpoints
│   │   ├── files.py            # /upload, /files endpoints
│   │   └── history.py          # /history/* endpoints
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py             # Auth request/response schemas
│   │   ├── user.py             # User schemas
│   │   ├── analysis.py         # Analysis schemas
│   │   ├── file.py             # File upload schemas
│   │   └── history.py          # History schemas
│   └── services/
│       ├── __init__.py
│       ├── ai_detection_service.py        # AI detection logic
│       ├── plagiarism_service.py          # Plagiarism checking
│       ├── summarization_service.py       # Text summarization
│       ├── file_handler_service.py        # File parsing/extraction
│       ├── analytics_service.py           # Text analytics
│       └── supabase_service.py            # Supabase integration
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
├── Dockerfile                 # Docker build config
├── database_schema.sql        # Supabase schema
├── run.py                     # Entrypoint script
└── API_DOCUMENTATION.md       # API reference
```

---

## API Endpoints Summary

**Auth:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Current user profile
- `PATCH /api/v1/auth/me` - Update current user profile
- `DELETE /api/v1/auth/me` - Delete current user account

**Analysis:**
- `POST /api/v1/analysis/ai-detect` - AI detection
- `POST /api/v1/analysis/plagiarism` - Plagiarism check
- `POST /api/v1/analysis/summarize` - Text summary
- `POST /api/v1/analysis/full-report` - Full analysis
- `POST /api/v1/analysis/full-report/download` - Downloadable Markdown report

**Files:**
- `POST /api/v1/upload` - Upload file
- `GET /api/v1/files` - Get user files

**History:**
- `GET /api/v1/history` - Get analysis history
- `GET /api/v1/history/{id}` - Get specific analysis
- `DELETE /api/v1/history/{id}` - Delete analysis

---

## Testing

### Run Tests

```bash
pytest -v
```

### With Coverage

```bash
pytest --cov=app
```

### Test Specific Module

```bash
pytest app/routes/test_auth.py -v
```

---

## Troubleshooting

### Model Download Issues

Models are downloaded automatically on first use. To pre-download:

```bash
python -c "from transformers import AutoModel; AutoModel.from_pretrained('roberta-base-openai-detector')"
```

### Database Connection

For SQLite (default):
- Auto-created at runtime
- No setup needed

For PostgreSQL:
- Ensure `DATABASE_URL` is correct
- Run migrations: `alembic upgrade head`
- Check connection: `psql -c "SELECT 1"`

### Supabase Connection

- Verify `SUPABASE_URL` and keys in `.env`
- Check network connectivity
- Enable API access in Supabase dashboard

---

## Performance Optimization

### Caching

Add Redis for caching:

```python
from redis import Redis
redis_client = Redis(host='localhost', port=6379)
```

### Background Tasks

Use Celery for heavy operations:

```python
from celery import Celery
celery_app = Celery('beta-ai')
```

### Database Optimization

- Enable connection pooling
- Add appropriate indexes
- Use prepared statements

---

## Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Use HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use strong database passwords
- [ ] Enable Supabase RLS policies
- [ ] Set up firewalls
- [ ] Regular security audits
- [ ] Monitor logs for suspicious activity

---

## Monitoring & Logging

Logs are output to console. For production, use:

```python
import logging
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

---

## Support & Resources

- **API Docs:** http://localhost:8001/docs
- **Supabase Docs:** https://supabase.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Transformers Docs:** https://huggingface.co/docs

---

**Last Updated:** June 2026  
**Version:** 1.0.0
