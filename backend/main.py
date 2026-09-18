from datetime import datetime, timezone, timedelta
from json import JSONDecodeError, loads
from pathlib import Path

from bson import ObjectId
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image
import io

from pymongo.errors import DuplicateKeyError

from auth import (
    AccountStatusRequest,
    InstitutionCreateRequest,
    LoginRequest,
    SignupRequest,
    create_access_token,
    get_current_user,
    normalize_email,
    password_hash,
    public_user,
    require_roles,
)
from database import ensure_indexes, institutions_collection, patient_files_collection, users_collection
from storage import (
    ALLOWED_ANGLES,
    ANGLE_LABELS,
    delete_screening_images,
    image_storage_path,
    signed_image_url,
    upload_screening_image,
)

app = FastAPI(title="Caries Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path(__file__).resolve().parent / "model" / "best.pt"
model = YOLO(str(MODEL_PATH))


@app.on_event("startup")
def initialize_database():
    ensure_indexes()

# The notebook merges the original classes into one class named "caries".
TARGET_CLASS_IDS = {0}


class ScreeningNotesRequest(BaseModel):
    notes: str = ""


class ScreeningValidationRequest(BaseModel):
    validated_angles: list[str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/institutions")
def list_institutions(current_user: dict = Depends(require_roles("admin"))):
    institutions = institutions_collection.find({}, {"name": 1, "status": 1}).sort("name", 1)
    return [
        {
            "id": str(item["_id"]),
            "name": item["name"],
            "status": item.get("status", "active"),
        }
        for item in institutions
    ]


def _public_user_with_institution(user: dict) -> dict:
    payload = public_user(user)
    institution = None
    if user.get("institution_id"):
        institution = institutions_collection.find_one({"_id": user["institution_id"]}, {"name": 1})
    payload["institution_name"] = institution["name"] if institution else ""
    return payload


@app.post("/admin/institutions", status_code=201)
def create_institution(
    payload: InstitutionCreateRequest,
    current_user: dict = Depends(require_roles("admin")),
):
    name = payload.name.strip()
    document = {
        "name": name,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = institutions_collection.insert_one(document)
    except DuplicateKeyError as error:
        raise HTTPException(status_code=409, detail="An institution with this name already exists.") from error
    document["_id"] = result.inserted_id
    return {
        "id": str(document["_id"]),
        "name": document["name"],
        "status": document["status"],
    }


@app.get("/admin/users")
def list_users(current_user: dict = Depends(require_roles("admin"))):
    users = users_collection.find({"role": {"$ne": "admin"}}).sort("created_at", -1)
    return [_public_user_with_institution(user) for user in users]


@app.post("/admin/users", status_code=201)
def create_user_account(
    payload: SignupRequest,
    current_user: dict = Depends(require_roles("admin")),
):
    role = payload.role.strip().lower()
    if role not in {"staff", "dentist"}:
        raise HTTPException(status_code=400, detail="Only staff or dentist accounts can be created.")

    try:
        institution_id = ObjectId(payload.institution_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid institution id.") from None

    institution = institutions_collection.find_one({"_id": institution_id, "status": "active"})
    if not institution:
        raise HTTPException(status_code=400, detail="The institution does not exist or is inactive.")

    email = normalize_email(str(payload.email))
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    now = datetime.now(timezone.utc)
    user = {
        "full_name": payload.full_name.strip(),
        "email": email,
        "password_hash": password_hash.hash(payload.password),
        "role": role,
        "institution_id": institution_id,
        "status": "active",
        "created_at": now,
        "updated_at": now,
        "validated_at": now,
        "validated_by": current_user["_id"],
    }
    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id
    return {
        "message": "Account created. The user can sign in immediately.",
        "user": _public_user_with_institution(user),
    }


@app.post("/auth/login")
def login(payload: LoginRequest):
    email = normalize_email(str(payload.email))
    user = users_collection.find_one({"email": email})
    if not user or not password_hash.verify(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="This account is not active yet.")

    return {"access_token": create_access_token(user), "token_type": "bearer", "user": public_user(user)}


@app.get("/auth/me")
def current_account(current_user: dict = Depends(get_current_user)):
    return public_user(current_user)


@app.get("/admin/users/pending")
def pending_users(current_user: dict = Depends(require_roles("admin"))):
    users = users_collection.find({"status": "pending"}).sort("created_at", 1)
    return [public_user(user) for user in users]


@app.patch("/admin/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: AccountStatusRequest,
    current_user: dict = Depends(require_roles("admin")),
):
    if payload.status not in {"active", "rejected", "suspended"}:
        raise HTTPException(status_code=400, detail="Invalid account status.")
    try:
        target_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id.") from None

    update = {
        "status": payload.status,
        "updated_at": datetime.now(timezone.utc),
    }
    if payload.status == "active":
        update["validated_at"] = datetime.now(timezone.utc)
        update["validated_by"] = current_user["_id"]

    result = users_collection.update_one({"_id": target_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")
    user = users_collection.find_one({"_id": target_id})
    return public_user(user)


def _serialize_datetime(value) -> str:
    if value is None:
        return datetime.now(timezone.utc).isoformat()
    if getattr(value, "tzinfo", None) is None:
        return value.replace(tzinfo=timezone.utc).isoformat()
    return value.isoformat()


def _same_institution(user: dict, record: dict) -> bool:
    return user.get("institution_id") == record.get("institution_id")


def serialize_screening(record: dict) -> dict:
    photos = []
    for image in record.get("images", []):
        storage_path = image.get("storage_path")
        photos.append({
            "angle": image.get("angle"),
            "label": image.get("label") or ANGLE_LABELS.get(image.get("angle"), image.get("angle")),
            "image": signed_image_url(storage_path) if storage_path else "",
            "detections": image.get("detections") or [],
        })

    patient = record.get("patient") or {}
    return {
        "id": str(record["_id"]),
        "patient": {
            # Older records may retain legacy fields, but new screenings never store them.
            "code": patient.get("code") or patient.get("identity") or "Uncoded record",
        },
        "photos": photos,
        "notes": record.get("notes") or "",
        "result": record.get("result") or "",
        "flaggedAreas": record.get("flagged_areas") or 0,
        "savedAt": _serialize_datetime(record.get("created_at")),
        "validatedAngles": record.get("validated_angles") or [],
        "fileValidated": record.get("file_validated", False),
        "validatedAt": _serialize_datetime(record.get("validated_at")) if record.get("validated_at") else None,
    }


def _require_institution_record(user: dict, screening_id: str) -> dict:
    try:
        record_id = ObjectId(screening_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid screening id.") from None

    record = patient_files_collection.find_one({"_id": record_id})
    if not record:
        raise HTTPException(status_code=404, detail="Screening not found.")
    if not _same_institution(user, record):
        raise HTTPException(status_code=403, detail="You cannot access this screening.")
    return record


@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_roles("staff")),
):
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


@app.post("/screenings", status_code=201)
async def create_screening(
    patient_code: str = Form(..., min_length=6, max_length=64),
    guardian_consent_confirmed: bool = Form(...),
    notes: str = Form(""),
    result: str = Form(""),
    flagged_areas: int = Form(0),
    detections_json: str = Form("{}"),
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(require_roles("staff")),
):
    if not guardian_consent_confirmed:
        raise HTTPException(status_code=400, detail="Verified parent or guardian authorisation is required before a minor's screening can be processed.")
    try:
        detections_by_angle = loads(detections_json)
        if not isinstance(detections_by_angle, dict):
            raise ValueError("detections must be an object")
    except (JSONDecodeError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Invalid detections payload.") from error

    if not files:
        raise HTTPException(status_code=400, detail="At least one screening image is required.")
    if not isinstance(files, list):
        files = [files]

    screening_id = ObjectId()
    institution_id = current_user["institution_id"]
    images = []

    for upload in files:
        stem = Path(upload.filename or "").stem.lower()
        angle = stem if stem in ALLOWED_ANGLES else None
        if angle is None:
            raise HTTPException(
                status_code=400,
                detail="Each image file must be named after its angle (front, upper, lower, left, right).",
            )

        content = await upload.read()
        if not content:
            raise HTTPException(status_code=400, detail=f"The {angle} image is empty.")
        try:
            Image.open(io.BytesIO(content)).verify()
        except (OSError, ValueError) as error:
            raise HTTPException(status_code=400, detail=f"The {angle} file is not a valid image.") from error

        content_type = upload.content_type if upload.content_type and upload.content_type.startswith("image/") else "image/jpeg"

        extension = "jpg"
        if "png" in content_type:
            extension = "png"
        storage_path = image_storage_path(str(institution_id), str(screening_id), angle, extension)
        upload_screening_image(storage_path, content, content_type)

        images.append({
            "angle": angle,
            "label": ANGLE_LABELS[angle],
            "storage_path": storage_path,
            "content_type": content_type,
            "detections": detections_by_angle.get(angle) or [],
        })

    record = {
        "_id": screening_id,
        "institution_id": institution_id,
        "created_by": current_user["_id"],
        "patient": {
            "code": patient_code.strip(),
        },
        "consent": {
            "guardian_confirmed": True,
            "confirmed_at": datetime.now(timezone.utc),
            "legal_reference": "Organic Law No. 2004-63 / INPDP",
        },
        "images": images,
        "notes": notes.strip(),
        "result": result.strip(),
        "flagged_areas": flagged_areas,
        "validated_angles": [],
        "file_validated": False,
        "validated_at": None,
        "validated_by": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "delete_after": datetime.now(timezone.utc) + timedelta(days=365),
    }
    patient_files_collection.insert_one(record)
    return serialize_screening(record)


@app.get("/screenings")
def list_screenings(current_user: dict = Depends(require_roles("dentist", "admin"))):
    records = patient_files_collection.find(
        {"institution_id": current_user["institution_id"]}
    ).sort("created_at", -1)
    return [serialize_screening(record) for record in records]


@app.patch("/screenings/{screening_id}/notes")
def update_screening_notes(
    screening_id: str,
    payload: ScreeningNotesRequest,
    current_user: dict = Depends(require_roles("dentist", "admin")),
):
    record = _require_institution_record(current_user, screening_id)
    patient_files_collection.update_one(
        {"_id": record["_id"]},
        {
            "$set": {
                "notes": payload.notes.strip(),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    updated = patient_files_collection.find_one({"_id": record["_id"]})
    return serialize_screening(updated)


@app.patch("/screenings/{screening_id}/validation")
def update_screening_validation(
    screening_id: str,
    payload: ScreeningValidationRequest,
    current_user: dict = Depends(require_roles("dentist", "admin")),
):
    record = _require_institution_record(current_user, screening_id)
    angles = [angle for angle in payload.validated_angles if angle in ALLOWED_ANGLES]
    patient_files_collection.update_one(
        {"_id": record["_id"]},
        {
            "$set": {
                "validated_angles": angles,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    updated = patient_files_collection.find_one({"_id": record["_id"]})
    return serialize_screening(updated)


@app.patch("/screenings/{screening_id}/file-validation")
def complete_file_validation(
    screening_id: str,
    current_user: dict = Depends(require_roles("dentist")),
):
    record = _require_institution_record(current_user, screening_id)
    patient_files_collection.update_one(
        {"_id": record["_id"]},
        {
            "$set": {
                "file_validated": True,
                "validated_at": datetime.now(timezone.utc),
                "validated_by": current_user["_id"],
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    updated = patient_files_collection.find_one({"_id": record["_id"]})
    return serialize_screening(updated)


@app.delete("/screenings/{screening_id}")
def delete_screening(
    screening_id: str,
    current_user: dict = Depends(require_roles("dentist")),
):
    record = _require_institution_record(current_user, screening_id)
    storage_paths = [
        image.get("storage_path")
        for image in record.get("images", [])
        if image.get("storage_path")
    ]
    delete_screening_images(storage_paths)
    patient_files_collection.delete_one({"_id": record["_id"]})
    return {"deleted": True}
