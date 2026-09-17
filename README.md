# SpotEarly Dental Screening

SpotEarly is a full-stack dental screening application that helps healthcare teams collect dental images, run AI-assisted caries detection, and review the results in a structured patient file.

The application is designed as a screening aid. It highlights image regions that may require professional review; it does not provide a medical diagnosis.

## 1. Project Overview

### The problem

Early signs of dental caries can be difficult to identify consistently during an initial screening, especially when several dental views must be collected and reviewed. Manual review can also make it difficult to preserve the relationship between a patient, a specific image angle, and the detected regions.

### The solution

SpotEarly combines:

- A guided workflow for collecting patient information.
- Camera capture and image upload for several dental views.
- An Ultralytics YOLO object-detection model trained for caries detection.
- Per-image bounding boxes and confidence scores.
- A patient file that preserves the result for every uploaded angle.
- A local dashboard for reviewing and saving screening records.

The model is executed by the backend. The frontend sends each selected image independently, then displays the returned detections on the corresponding image.

## 2. Main Features

- Patient registration with name, age, and identity fields.
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
- Patient file saving through browser local storage.
- Dashboard search and image review workflow.

## 3. System Architecture

```text
User
  |
  v
React + Vite frontend
  |  multipart image upload
  v
FastAPI backend
  |  Ultralytics YOLO inference
  v
backend/model/best.pt
  |
  v
Normalized detection response
```



## 4. Important Files

### Backend

| File                                                 | Responsibility                                                         |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| [backend/main.py](backend/main.py)                   | FastAPI application, model loading, validation, and inference endpoint |
| [backend/requirements.txt](backend/requirements.txt) | Python dependencies                                                    |
| [backend/model/best.pt](backend/model/best.pt)       | Trained YOLO model used in production inference                        |

### Frontend

| File                                                                                                             | Responsibility                                             |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [frontend/src/main.tsx](frontend/src/main.tsx)                                                                   | React application bootstrap                                |
| [frontend/src/App.tsx](frontend/src/App.tsx)                                                                     | Application routing                                        |
| [frontend/src/pages/NewScreening.tsx](frontend/src/pages/NewScreening.tsx)                                       | Patient intake, image collection, and multi-image analysis |
| [frontend/src/pages/PatientFile.tsx](frontend/src/pages/PatientFile.tsx)                                         | Per-image AI results, confidence values, notes, and saving |
| [frontend/src/pages/Dashboard.tsx](frontend/src/pages/Dashboard.tsx)                                             | Saved screening records and image review                   |
| [frontend/src/lib/detectionApi.ts](frontend/src/lib/detectionApi.ts)                                             | Frontend API client and response validation                |
| [frontend/src/components/screening/DetectionOverlay.tsx](frontend/src/components/screening/DetectionOverlay.tsx) | Image overlay and confidence labels                        |
| [frontend/src/components/screening/DetectionOverlay.css](frontend/src/components/screening/DetectionOverlay.css) | Detection box and confidence label styling                 |
| [frontend/src/pages/screeningTypes.ts](frontend/src/pages/screeningTypes.ts)                                     | Shared patient and screening record types                  |

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

## 6. Installation

### Backend installation on Windows

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
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
git clone https://github.com/kassemabbassi/Connectathon-
```
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








## 8. Typical User Workflow

1. Open **New screening**.
2. Enter the patient details.
3. Upload or capture one or more dental images.
4. Start the screening from any available angle.
5. Wait for the AI analysis to complete.
6. Review each image and its confidence values.
7. Add clinical notes if needed.
8. Save the patient file.
9. Review the saved record from the dashboard.



