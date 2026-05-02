# AI Resume Optimizer

A SaaS tool that analyzes resumes and returns an ATS score, actionable improvement suggestions, and AI-rewritten content — all in a single request. No login required.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (deployed on Vercel) |
| Backend | Node.js + Express (deployed on Render) |
| AI | OpenAI API (`gpt-4o-mini`) |
| PDF parsing | `pdf-parse` |
| DOCX parsing | `mammoth` |

---

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+
- An OpenAI API key

### 1. Install dependencies

```bash
cd ai-resume-optimizer
npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your OpenAI API key:

```
OPENAI_API_KEY=sk-your-key-here
PORT=3001
```

### 3. Start the backend

```bash
npm run dev:backend
```

The API will be available at `http://localhost:3001`.

### 4. Start the frontend

```bash
npm run dev:frontend
```

The app will be available at `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to the backend automatically.

---

## Running Tests

### Backend (unit + integration)

```bash
npm run test:backend
```

### Frontend (component tests)

```bash
npm run test:frontend
```

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your repository
3. Set the following:
   - **Build command**: `npm install && npm run build`
   - **Start command**: `node dist/index.js`
   - **Root directory**: `backend`
4. Add environment variable in the Render dashboard:
   - `OPENAI_API_KEY` — your OpenAI API key (mark as secret)

Alternatively, use the `backend/render.yaml` file with Render's Infrastructure as Code support.

### Frontend → Vercel

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your repository
3. Set the following:
   - **Framework preset**: Vite
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL` — your Render backend URL (e.g. `https://your-app.onrender.com`)
5. Update `frontend/vercel.json` to replace `your-render-backend-url.onrender.com` with your actual Render URL

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI rewrite generation |
| `PORT` | No | Server port (default: 3001) |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL for API proxy (Vercel deployment) |

---

## API

### `POST /api/analyze`

Upload a resume for analysis.

**Request**: `multipart/form-data` with field `resume` (PDF or DOCX, max 5 MB)

**Response**:
```json
{
  "score": 78,
  "issues": ["Professional Summary section is missing"],
  "suggestions": ["Add a 2–3 line professional summary"],
  "rewrites": {
    "summary": "Results-driven engineer...",
    "experience": ["Led migration reducing deployment time by 40%."]
  },
  "errors": []
}
```

### `GET /health`

Returns `{ "status": "ok" }` — used for health checks.

---

## Architecture

```
User → React Frontend (Vercel)
         ↓ POST /api/analyze
       Node.js API (Render)
         ↓
       Upload_Service (validate type + size)
         ↓
       Parser_Service (pdf-parse / mammoth)
         ↓
       Analysis_Service (section detection, scoring inputs)
         ↓ (parallel)
       Scoring_Engine + AI_Rewrite_Service (OpenAI)
         ↓
       Result_Renderer → JSON response
```

The pipeline is **fail-partial** by design: if AI rewrite fails, the score and suggestions are still returned. If parsing fails, the pipeline short-circuits immediately.

---

## Privacy

- Resume files are never written to disk — all processing is in-memory
- No resume content is logged at any level
- No user data is retained after the request lifecycle ends
- OpenAI API calls are made over HTTPS only
