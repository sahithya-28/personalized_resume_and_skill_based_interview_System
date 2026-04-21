# Smart Interview System

This project is now a fullstack app:
- `backend/` provides REST APIs (FastAPI)
- `frontend/` provides the React UI (Vite)

## Project Structure

```text
project/
├── backend/
│   ├── main.py
│   ├── resume_generator.py
│   └── resume_scorer.py
├── frontend/
│   ├── src/
│   └── package.json
├── requirements.txt
└── README.md
```

## Backend Setup

```bash
pip install -r requirements.txt
cd backend
uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`.

Available endpoints:
- `GET /health`
- `POST /generate-resume`
- `POST /analyze-resume`

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Frontend runs on `http://localhost:3000`.

Set `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## API Integration Used by Frontend

- `POST {VITE_API_BASE_URL}/generate-resume`
- `POST {VITE_API_BASE_URL}/analyze-resume`

## Deployment

Deploy the backend and frontend separately.

### Backend

Install Python dependencies and run the API from the `backend/` directory:

```bash
pip install -r requirements.txt
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Production notes:
- Add `GROQ_API_KEY` in `backend/.env` if you want AI-powered suggestions.
- The backend writes to `backend/app.db` and `uploads/resumes`, so your host must allow persistent writable storage.
- In production, restrict CORS in `backend/main.py` instead of using `allow_origins=["*"]`.

### Frontend

Build the frontend after pointing it at your deployed backend:

```bash
cd frontend
npm install
echo VITE_API_BASE_URL=https://your-backend-url.com > .env
npm run build
```

Deploy the generated `frontend/dist` folder to any static host such as Vercel, Netlify, or GitHub Pages.
