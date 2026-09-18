# SpotEarly Dental Screening

SpotEarly is a full-stack, multi-institution dental-screening platform that helps school and healthcare teams capture dental images, run AI-assisted caries detection, and complete professional review in a structured patient file.

The application is designed as a screening aid. It highlights image regions that may require professional review; it does not provide a medical diagnosis.

## 1. Project Overview

### The problem

Early signs of dental caries can be difficult to identify consistently during an initial screening, especially when several dental views must be collected and reviewed. Manual review can also make it difficult to preserve the relationship between a patient, a specific image angle, and the detected regions.

### The solution

SpotEarly combines:

- Role-based workspaces for administrators, school staff, and dentists.
- A guided, consent-aware workflow for collecting anonymous patient codes.
- Camera capture and image upload for several dental views.
- An Ultralytics YOLO object-detection model trained for caries detection.
- Per-image bounding boxes and confidence scores.
- A patient file that preserves the result for every uploaded angle.
- Secure, institution-scoped storage and dentist review for saved screening records.

The model is executed by the backend. The frontend sends each selected image independently, then displays the returned detections on the corresponding image.

## 2. Main Features

- Anonymous patient-code registration without names, ages, or government/student identity fields.
- Upload or camera capture for:
  - Front bite
  - Upper arch
  - Lower arch
  - Left side
  - Right side
- No mandatory image angle: screening can start with any uploaded image.
- Multi-image analysis using the AI model.
- Colored detection boxes for multiple findings.
- Confidence percentage displayed beside each detection box.
- Per-image result sections showing the angle, image, detections, and confidence values.
- Persistent screening files in MongoDB with private images in Supabase Storage.
- Institution-scoped dashboard search, image review, clinical notes, and image/file validation.
- Administrator tools for institutions and staff/dentist accounts.
- English and Arabic interface support, including right-to-left Arabic layout.

## 3. System Architecture

![SpotEarly system architecture](sys.png)

The system is organized into four cooperating layers:

1. **Frontend:** A React and TypeScript interface provides role-based workflows for administration, capture, screening, and clinical review.
2. **Backend:** A FastAPI service enforces sessions, CSRF protection, roles, institution isolation, image validation, and REST APIs.
3. **Data and storage:** MongoDB stores structured records while Supabase Storage keeps screening images private and serves them through signed URLs.
4. **AI/ML:** The fine-tuned Ultralytics YOLO model in `backend/model/best.pt` detects possible caries regions and returns normalized bounding boxes with confidence scores.

The request flows from the frontend to the backend as a multipart image upload. After inference, the backend returns structured JSON. The frontend then draws each detection on the correct image and preserves the result for the patient file.

```text
User
  |
  v
React + Vite frontend (role-based UI)
  |  authenticated multipart upload / JSON API
  v
FastAPI backend (RBAC + CSRF + tenant checks)
  |  Ultralytics YOLO inference
  v
backend/model/best.pt
  |
  v
MongoDB records + Supabase private image objects
```

## 4. Important Files

### Backend

| File | Responsibility |
| --- | --- |
| [backend/main.py](backend/main.py) | FastAPI routes for authentication, administration, inference, screening files, notes, validation, and deletion. |
| [backend/auth.py](backend/auth.py) | Argon2 password hashing, JWT creation, cookie-session validation, CSRF enforcement, and role dependencies. |
| [backend/config.py](backend/config.py) | Environment-backed MongoDB, cookie, CORS, JWT, and Supabase settings. |
| [backend/database.py](backend/database.py) | MongoDB connections, collections, tenant indexes, and TTL retention index. |
| [backend/storage.py](backend/storage.py) | Supabase image upload, deletion, storage-key creation, and signed URL generation. |
| [backend/requirements.txt](backend/requirements.txt) | Python and service dependencies. |
| [backend/model/best.pt](backend/model/best.pt) | YOLO weights loaded by the API for caries detection. |

### Frontend

| File | Responsibility |
| --- | --- |
| [frontend/src/main.tsx](frontend/src/main.tsx) | React application bootstrap. |
| [frontend/src/App.tsx](frontend/src/App.tsx) | Routes and role-protected workspaces. |
| [frontend/src/context/AuthContext.tsx](frontend/src/context/AuthContext.tsx) | Current-session state and login/logout lifecycle. |
| [frontend/src/context/LanguageContext.tsx](frontend/src/context/LanguageContext.tsx) | English/Arabic language state, translations, and RTL document direction. |
| [frontend/src/pages/Admin.tsx](frontend/src/pages/Admin.tsx) | Institution and staff/dentist account management. |
| [frontend/src/pages/NewScreening.tsx](frontend/src/pages/NewScreening.tsx) | Anonymous intake, consent confirmation, image collection, and multi-image analysis. |
| [frontend/src/pages/PatientFile.tsx](frontend/src/pages/PatientFile.tsx) | Per-image findings, confidence values, and screening-file saving. |
| [frontend/src/pages/Dashboard.tsx](frontend/src/pages/Dashboard.tsx) | Dentist file search, review, notes, image validation, and complete-file validation. |
| [frontend/src/lib/authApi.ts](frontend/src/lib/authApi.ts) | Session, CSRF-aware authentication, institution, and account API client. |
| [frontend/src/lib/detectionApi.ts](frontend/src/lib/detectionApi.ts) | Inference upload client and detection response types. |
| [frontend/src/lib/screeningApi.ts](frontend/src/lib/screeningApi.ts) | Screening persistence, review, validation, and deletion API client. |
| [frontend/src/components/screening/DetectionOverlay.tsx](frontend/src/components/screening/DetectionOverlay.tsx) | Image overlay and confidence labels. |
| [frontend/src/pages/screeningTypes.ts](frontend/src/pages/screeningTypes.ts) | Shared patient and screening record types. |

### Model development

| File                                             | Responsibility                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| [caries_detection.ipynb](caries_detection.ipynb) | Dataset audit, YOLO dataset preparation, training, and evaluation |

## 5. Requirements

- Windows, macOS, or Linux
- Python 3.10 or newer recommended
- Node.js 18 or newer recommended
- npm
- A trained model at `backend/model/best.pt`
- MongoDB instance
- Supabase project and private image-storage bucket

## 6. Installation
```bash
git clone https://github.com/kassemabbassi/Connectathon-
cd Connectathon-
```

Before starting the backend, configure MongoDB, Supabase Storage, session settings, and CORS as described in [Section 13](#13-local-setup-and-configuration). The application requires these services for persistent screening files and private image access.
### Backend installation on Windows

From the repository root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks activation, run the backend with the virtual-environment executable directly:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Backend installation on macOS or Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend installation

```bash
cd frontend
npm install
```

## 7. Running the Application

Run the backend in one terminal:

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Run the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

The backend API will normally be available at:

```text
http://localhost:8000
```

### Session security

Authentication uses an HttpOnly session cookie; the browser never stores the JWT in localStorage or exposes it to JavaScript. State-changing API requests also require a CSRF token.

For production, serve both applications over HTTPS and set these backend environment variables:

```text
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
CORS_ORIGINS=https://your-app.example
JWT_SECRET=<a-long-random-secret>
```

`COOKIE_SECURE=false` is only appropriate for local HTTP development.








## 8. Typical User Workflow

1. An administrator creates an active institution and staff/dentist accounts.
2. A staff member signs in, opens **New screening**, and enters a non-identifying patient code.
3. The staff member confirms guardian authorisation, then uploads or captures one or more dental images.
4. The backend analyzes every image independently and returns possible caries detections.
5. The staff member reviews the image overlays and saves the screening file.
6. A dentist from the same institution opens the dashboard and reviews the images and model output.
7. The dentist adds clinical notes, validates reviewed image angles, and may mark the full file clinically validated.

## 9. AI Request and Response

### Request flow

Each uploaded image is analyzed independently. The staff-only frontend converts the captured image into a file, sends it to the protected backend using `multipart/form-data`, and uses the response to render detections for that specific dental view. The request includes the session cookie and CSRF header.

Endpoint:

```http
POST http://localhost:8000/detect
Content-Type: multipart/form-data
```

The multipart field is named `file`.



### Response

The backend runs the YOLO model and returns the image dimensions plus one entry for every detected caries region:

```json
{
  "detections": [
    {
      "label": "caries",
      "confidence": 0.873,
      "x": 0.241,
      "y": 0.318,
      "width": 0.126,
      "height": 0.142
    }
  ],
  "image_width": 1280,
  "image_height": 960
}
```

Response fields:

| Field                         | Description                                |
| ----------------------------- | ------------------------------------------ |
| `detections`                  | List of detected regions                   |
| `label`                       | Model class name, currently `caries`       |
| `confidence`                  | Model confidence score between `0` and `1` |
| `x`, `y`                      | Normalized top-left coordinate of the box  |
| `width`, `height`             | Normalized dimensions of the box           |
| `image_width`, `image_height` | Original image dimensions in pixels        |

When no caries region is detected, the API returns an empty list:

```json
{
  "detections": [],
  "image_width": 1280,
  "image_height": 960
}
```

The frontend uses the normalized coordinates to draw the box on the corresponding uploaded image. Each dental angle is processed separately, so the result for an upper-arch image is never mixed with the result for a lateral image.

---

## 10. Current Implementation Guide

This section documents the complete application: a role-based, multi-institution screening workflow with persistent records, private image storage, and clinical review.

### Product scope

SpotEarly helps school and dental teams collect intraoral photographs, identify regions that may warrant review, and keep a structured, institution-scoped record. It is a **screening aid**, not a diagnostic or treatment system. A model result is visual decision support only; a licensed dentist must review a case before a clinical conclusion or family communication.

| Role | Workspace | Responsibilities |
| --- | --- | --- |
| `admin` | `/admin` | Creates institutions and staff/dentist accounts; manages the platform's account structure. |
| `staff` | `/new` | Confirms guardian authorisation, captures or uploads dental views, runs AI screening, and saves an anonymous file. |
| `dentist` | `/dashboard` | Reviews files from the same institution, writes notes, validates individual image angles, completes clinical file validation, and can delete files. |

The supported views are `front`, `upper`, `lower`, `left`, and `right`. A screening can contain one or more views. When saving, each image is submitted with its angle identifier so its detections remain attached to the correct photograph.

### End-to-end flow

```text
Admin creates institution and accounts
                |
                v
Staff confirms guardian authorisation and captures/uploads images
                |
                +--> POST /detect for each image (YOLO inference)
                |
                v
POST /screenings stores the anonymous record and private images
                |
                v
Dentist reviews the institution's file, notes, and detections
                |
                +--> per-angle validation and optional complete-file validation
```

## 11. Architecture and Data Flow

### Frontend

The client is a React 19 + TypeScript single-page application built with Vite and React Router. It contains landing, authentication, administration, screening, and dentist-review routes. Route guards guide users to their permitted workspace, while the API remains responsible for actual authorization.

English and Arabic are supported through the shared language context. Selecting Arabic also sets the document direction to right-to-left. API clients use `credentials: "include"`, so the browser sends session cookies without exposing the JWT to JavaScript.

### Backend and inference

FastAPI provides authentication, role-based authorization, institution administration, inference, screening persistence, and clinical-review endpoints. Ultralytics YOLO loads `backend/model/best.pt` when the API starts. `POST /detect` converts an upload to RGB with Pillow, runs inference using a `0.25` confidence threshold, and returns normalized boxes for the `caries` class.

Normalized coordinates make the overlay independent of the source resolution:

```text
Browser image -> multipart upload -> FastAPI -> YOLO model
                                      |
                                      v
                         normalized detections JSON
                                      |
                                      v
                         React overlay on the same image
```

### Persistence and tenant isolation

| Concern | Technology | Implementation |
| --- | --- | --- |
| Operational data | MongoDB | Institutions, users, anonymous patient codes, consent metadata, detections, notes, and validation state. |
| Image storage | Supabase Storage | Original screening images are stored in the configured private bucket. |
| Image access | Signed URLs | The API produces time-limited URLs when a file is serialized for review. The current lifetime is one hour. |
| AI inference | Ultralytics YOLO | Detects candidate caries regions from uploaded dental images. |

Images are keyed as `{institution_id}/{screening_id}/{angle}.{jpg|png}`. MongoDB keeps the object key and metadata, not binary image content. New records have a `delete_after` value one year after creation, and the database creates a TTL index for retention. Production deployments should configure a matching object-storage lifecycle rule for the image objects.

Every screening record includes the staff member's `institution_id`. List, review, update, and delete operations compare that value with the authenticated user's institution. This server-side check prevents cross-institution access even if an identifier is manipulated in the browser.

## 12. API Reference

Protected requests require an active session. Non-safe HTTP methods also require the CSRF token from the `dentalscreen_csrf` cookie in the `X-CSRF-Token` header.

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Liveness response. |
| `POST` | `/auth/login` | Public | Validates credentials and creates session/CSRF cookies. |
| `POST` | `/auth/logout` | Authenticated | Clears browser session cookies. |
| `GET` | `/auth/me` | Authenticated | Returns the current public user profile. |
| `GET`, `POST` | `/institutions`, `/admin/institutions` | Admin | Lists and creates institutions. |
| `GET`, `POST` | `/admin/users` | Admin | Lists and creates staff/dentist accounts. |
| `GET` | `/admin/users/pending` | Admin | Lists pending accounts. |
| `PATCH` | `/admin/users/{user_id}/status` | Admin | Updates an account status. |
| `POST` | `/detect` | Staff | Runs inference on one uploaded image. |
| `POST` | `/screenings` | Staff | Saves a consented screening and uploads images. |
| `GET` | `/screenings` | Dentist, admin | Lists screening files for the caller's institution. |
| `PATCH` | `/screenings/{id}/notes` | Dentist, admin | Saves clinical notes. |
| `PATCH` | `/screenings/{id}/validation` | Dentist, admin | Saves reviewed image angles. |
| `PATCH` | `/screenings/{id}/file-validation` | Dentist | Marks a file clinically validated. |
| `DELETE` | `/screenings/{id}` | Dentist | Deletes the record and its stored image objects. |

### Screening creation contract

`POST /screenings` is `multipart/form-data`:

| Field | Required | Description |
| --- | --- | --- |
| `patient_code` | Yes | Non-identifying code, 6–64 characters. Do not use a name or government identifier. |
| `guardian_consent_confirmed` | Yes | Must be `true`; the API rejects a minor's screening otherwise. |
| `files` | Yes | One or more images named `front`, `upper`, `lower`, `left`, or `right`. |
| `detections_json` | Yes | JSON object keyed by angle containing the inference output. |
| `notes`, `result`, `flagged_areas` | No | Initial workflow and summary metadata. |

An empty detection list means the model did not flag a region at the selected threshold. It never proves that disease is absent.

## 13. Local Setup and Configuration

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- MongoDB
- A Supabase project with a private storage bucket
- YOLO weights at `backend/model/best.pt`

Create `backend/.env` (it is ignored by Git):

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB=dentalscreen
JWT_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_MINUTES=60
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=server-only-service-role-key
SUPABASE_BUCKET=screening-images
```

For a non-default API URL, create `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:8000
```

Never place `SUPABASE_SERVICE_KEY` in frontend environment variables or commit it to source control.

Start the backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If PowerShell blocks activation, use:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Visit the Vite address, normally `http://localhost:5173`, and verify the API at `http://localhost:8000/health`.

The first administrator is provisioned outside public registration (for example, through a controlled MongoDB seed process using a compatible Argon2 password hash). That administrator then creates institutions and staff/dentist accounts from `/admin`. See [DB.md](DB.md) for the data model and seed guidance.

## 14. Security, Privacy, and Clinical Safety

### Implemented safeguards

- Passwords use `pwdlib`'s recommended Argon2 hashing configuration.
- The JWT is stored in an HttpOnly session cookie, not local storage.
- State-changing endpoints verify a CSRF cookie/header match using constant-time comparison.
- FastAPI enforces roles and institution membership server-side.
- Screening images remain in object storage and are returned through time-limited signed URLs.
- New screenings store an anonymous code rather than a name, age, or government/student identifier.
- Consent confirmation is required before the API processes a minor's screening.



