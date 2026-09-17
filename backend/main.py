from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI(title="Caries Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path(__file__).resolve().parent / "model" / "best.pt"
model = YOLO(str(MODEL_PATH))

# The notebook merges the original classes into one class named "caries".
TARGET_CLASS_IDS = {0}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="The uploaded file must be an image.")

    image_bytes = await file.read()
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except (OSError, ValueError) as error:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.") from error

    img_width, img_height = image.size

    results = model(image, conf=0.25, verbose=False)
    boxes = results[0].boxes

    detections = []
    for box in boxes:
        class_id = int(box.cls[0])
        if class_id not in TARGET_CLASS_IDS:
            continue

        confidence = float(box.conf[0])
        x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]

        detections.append({
            "label": "caries",
            "confidence": round(confidence, 3),
            "x": round(x1 / img_width, 4),
            "y": round(y1 / img_height, 4),
            "width": round((x2 - x1) / img_width, 4),
            "height": round((y2 - y1) / img_height, 4),
        })

    return {
        "detections": detections,
        "image_width": img_width,
        "image_height": img_height,
    }