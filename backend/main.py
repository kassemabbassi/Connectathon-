from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI(title="Caries Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Le chemin pointe vers le modèle dans le sous-dossier model/
model = YOLO("model/best.pt")

TARGET_CLASSES = {"Caries", "Cavity"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_width, img_height = image.size

    results = model(image, conf=0.25)
    boxes = results[0].boxes
    class_names = results[0].names

    detections = []
    for box in boxes:
        class_name = class_names[int(box.cls[0])]
        if class_name not in TARGET_CLASSES:
            continue

        confidence = float(box.conf[0])
        x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]

        detections.append({
            "label": class_name.lower(),
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