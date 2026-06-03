# Beta-AI Backend API Documentation

## Overview

Beta-AI Backend is a FastAPI-based service providing AI-powered content detection, plagiarism checking, text summarization, file processing, and user analytics.

**API Base URL:** `/api/v1`

---

## Setup & Installation

### Requirements
- Python 3.12+
- pip or conda
- Supabase account (optional, for production)
- OpenAI API key (for advanced features)

### Local Development Setup

1. **Clone and navigate to backend:**
   ```bash
   cd ai-detector/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

5. **Update .env with your configuration:**
   ```
   JWT_SECRET=your-secret-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_API_KEY=your-openai-key
   ```

6. **Run the server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```

7. **Access API documentation:**
   - Swagger UI: http://localhost:8001/docs
   - ReDoc: http://localhost:8001/redoc

---

## Docker Setup

### Build and Run Locally

```bash
docker-compose up --build
```

Backend will be available at `http://localhost:8001`
Frontend will be available at `http://localhost:3000`

### Production Deployment

```bash
docker build -t beta-ai-backend:latest -f ai-detector/backend/Dockerfile ai-detector/backend
docker run -p 8001:8001 --env-file .env beta-ai-backend:latest
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | dev/production | development |
| `DATABASE_URL` | Database connection string | sqlite+aiosqlite:///./test.db |
| `JWT_SECRET` | JWT signing key | dev-key |
| `SUPABASE_URL` | Supabase project URL | |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | |
| `OPENAI_API_KEY` | OpenAI API key | |
| `MAX_UPLOAD_SIZE_MB` | Max file upload size | 50 |

---

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

#### POST /auth/login
Login user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

#### GET /auth/me
Get current user profile. Requires authentication.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### POST /auth/logout
Logout user.

#### PATCH /auth/me
Update the current user's profile. Requires authentication.

**Request:**
```json
{
  "full_name": "Jane Doe"
}
```

#### DELETE /auth/me
Delete the current user's account and related records. Requires authentication.

---

### Analysis

#### POST /analysis/ai-detect
Detect AI-generated content in text.

**Request:**
```json
{
  "title": "AI Detection Analysis",
  "text": "Your text content here..."
}
```

**Response:**
```json
{
  "ai_score": 0.72,
  "confidence_score": 0.85,
  "sentence_analysis": [
    {
      "sentence": "This is a sample sentence.",
      "ai_score": 0.68,
      "suspicious": false
    }
  ]
}
```

#### POST /analysis/plagiarism
Check text for plagiarism.

**Request:**
```json
{
  "title": "Plagiarism Check",
  "text": "Your text content here..."
}
```

**Response:**
```json
{
  "plagiarism_score": 15.5,
  "matched_sections": [
    {
      "text": "Similar content excerpt...",
      "similarity": 0.82,
      "source": "source_1"
    }
  ],
  "matches_found": 2
}
```

#### POST /analysis/summarize
Generate text summary.

**Request:**
```json
{
  "title": "Text Summary",
  "text": "Your long text content here...",
  "summary_type": "short"
}
```

**Summary Types:** `short`, `detailed`, `bullet`

**Response:**
```json
{
  "summary": "Concise summary of the text.",
  "summary_type": "short"
}
```

#### POST /analysis/full-report
Generate comprehensive analysis report.

**Request:**
```json
{
  "title": "Full Analysis",
  "text": "Your text content here..."
}
```

#### POST /analysis/full-report/download
Generate the same comprehensive analysis as a downloadable Markdown report.

**Response:** `text/markdown` with a `Content-Disposition` attachment header.

**Response:**
```json
{
  "ai_score": 0.35,
  "plagiarism_score": 12.3,
  "summary": "Summary of content",
  "analytics": {
    "word_count": 456,
    "character_count": 2341,
    "sentence_count": 23,
    "reading_time_minutes": 3,
    "readability_score": 68.5,
    "vocabulary_diversity": 0.72,
    "top_terms": [
      {"term": "analysis", "frequency": 5}
    ]
  }
}
```

---

### File Management

#### POST /upload
Upload and process a file (PDF, DOCX, TXT).

**Request:** Multipart form-data
- `file`: Binary file (PDF, DOCX, or TXT)

**Response:**
```json
{
  "id": "uuid",
  "file_name": "document.pdf",
  "file_type": ".pdf",
  "file_url": "/api/v1/files/uuid",
  "uploaded_at": "2024-01-15T10:30:00Z"
}
```

#### GET /files
Get user's uploaded files.

**Response:**
```json
{
  "files": [
    {
      "id": "uuid",
      "file_name": "document.pdf",
      "file_type": ".pdf",
      "file_url": "/api/v1/files/uuid",
      "uploaded_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### History

#### GET /history
Get user's analysis history.

**Query Parameters:**
- `skip` (int): Number of records to skip (default: 0)
- `limit` (int): Number of records to return (default: 50)

**Response:**
```json
{
  "history": [
    {
      "id": "uuid",
      "title": "AI Detection Analysis",
      "ai_score": 0.72,
      "plagiarism_score": null,
      "summary": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET /history/{id}
Get specific analysis.

**Response:**
```json
{
  "id": "uuid",
  "title": "AI Detection Analysis",
  "ai_score": 0.72,
  "plagiarism_score": null,
  "summary": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### DELETE /history/{id}
Delete analysis.

**Response:**
```json
{
  "message": "Analysis deleted successfully"
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "detail": "Error description"
}
```

**Common Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found (resource doesn't exist)
- `500`: Server Error (internal error)

---

## Model Fallback Behavior

All AI models include intelligent fallback mechanisms:

### AI Detection
- **Primary:** Roberta-base OpenAI Detector
- **Fallback:** Heuristic keyword analysis (confidence ~40%)

### Plagiarism
- **Primary:** Sentence Transformers embeddings
- **Fallback:** Jaccard similarity (character-based)

### Summarization
- **Primary:** Google FLAN-T5 Small
- **Fallback:** Extractive summarization (sentence importance)

---

## Supabase Integration

### Initial Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Create new project with PostgreSQL

2. **Run Schema:**
   ```bash
   psql -h [host] -U postgres -f database_schema.sql
   ```

3. **Get Credentials:**
   - Copy URL and keys to .env
   - Enable Row-Level Security in Supabase console

4. **Setup Auth:**
   - Enable Email/Password provider
   - Configure redirect URLs

---

## Performance Considerations

- **Rate Limiting:** Implement per user/IP rate limits
- **Caching:** Cache analysis results with TTL
- **Async Processing:** Use Celery for heavy computations
- **Database:** Use connection pooling (PgBouncer for Supabase)
- **Model Loading:** Models load lazily on first use

---

## Security Best Practices

- ✅ Use strong JWT_SECRET in production
- ✅ Enable HTTPS in production
- ✅ Configure CORS properly
- ✅ Implement rate limiting
- ✅ Use environment variables for secrets
- ✅ Enable Supabase RLS policies
- ✅ Regular security audits

---

## Testing

Run tests:
```bash
pytest -v
```

With coverage:
```bash
pytest --cov=app
```

---

## Contributing

Follow these guidelines:
- Use black for code formatting
- Follow FastAPI best practices
- Add tests for new features
- Document API changes

---

## Support

For issues or questions:
- Check API docs: http://localhost:8001/docs
- Review error logs
- Consult Supabase documentation
- Open issue on GitHub

---

**Version:** 1.0.0  
**Last Updated:** June 2026
