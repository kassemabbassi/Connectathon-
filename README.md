# Connectathon Project Reading Guide

This repository contains a small full-stack application for dental screening: a React frontend for the user experience and a FastAPI backend that runs an ML model to detect caries in uploaded dental images.

## Where to look first

If you are reviewing the code, start here:

1. `frontend/src/App.tsx`  
   This is the main frontend entry for routing. It shows the app structure and the main pages.

2. `frontend/src/main.tsx`  
   This is the React application bootstrap. It mounts the app into the DOM.

3. `backend/main.py`  
   This is the backend entry point. It creates the FastAPI app, exposes the API routes, and loads the YOLO model.

4. `frontend/src/pages/`  
   This folder contains the main screens of the app, such as landing, new screening, and dashboard.

5. `backend/model/best.pt`  
   This is the trained ML model used by the backend for object detection.

## Repository structure

```text
Connectathon-/
├── backend/
│   ├── main.py                  # FastAPI API entry point
│   ├── requirements.txt         # Python dependencies
│   └── model/
│       └── best.pt              # Trained detection model
├── frontend/
│   ├── package.json             # Frontend scripts and dependencies
│   ├── src/
│   │   ├── main.tsx             # App bootstrap
│   │   ├── App.tsx              # Routing config
│   │   ├── pages/               # Screens/views
│   │   ├── components/          # Reusable UI components
│   │   ├── lib/                 # Helper logic
│   │   ├── assets/              # Static assets
│   │   ├── App.css              # App styling
│   │   └── index.css            # Global styling
│   ├── index.html               # App HTML shell
│   ├── vite.config.ts           # Vite configuration
│   └── README.md                # Frontend-specific default template readme
├── README.md                    # This file
└── .gitignore
```

## Entry points

- Frontend entry point: `frontend/src/main.tsx`
- Frontend app routing: `frontend/src/App.tsx`
- Backend API entry point: `backend/main.py`

## How to run locally

### 1) Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API exposes a health check at `/health` and an image-analysis endpoint at `/detect`.

### 2) Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the local URL shown by Vite, typically `http://localhost:5173`.

## What the app does

- The frontend lets a user upload or review dental imaging data.
- The backend receives the image and runs the YOLO model.
- The model detects relevant dental findings and returns bounding boxes and confidence scores to the frontend.
- The app is organized as a small product dashboard with a screening workflow.

## Reviewer checklist

If you are reviewing this repo for the first time, the most important files to read are:

- `backend/main.py` for the API logic and model integration
- `frontend/src/App.tsx` for page flow and navigation
- `frontend/src/pages/` for the UI behavior and user experience
- `backend/requirements.txt` for the Python runtime dependencies
- `frontend/package.json` for the frontend scripts and libraries

This is the shortest path to understand the project without reading every file in detail.
