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
npm start
```

Frontend runs on `http://localhost:3000`.

## API Integration Used by Frontend

- `POST http://localhost:8000/generate-resume`
- `POST http://localhost:8000/analyze-resume`
