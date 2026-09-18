# Database Design — SpotEarly

This document describes the persistent data model used by SpotEarly, a multi-institution dental screening platform. The operational database is **MongoDB**. Binary images are **not** stored in MongoDB; they are stored in **Supabase Storage**. MongoDB only keeps structured records and object paths.

| Component | Technology | Purpose |
|-----------|------------|---------|
| Operational database | MongoDB (`dentalscreen`) | Users, institutions, screening files, AI findings |
| Object storage | Supabase Storage (`screening-images`) | Intraoral photographs |

Default local connection:

- URI: `mongodb://127.0.0.1:27017`
- Database name: `dentalscreen`

---

## 1. Design principles

SpotEarly is a **multi-tenant** system. Every user and every patient file belongs to one institution (school or health centre). Access control is enforced in the API by comparing the authenticated user’s `institution_id` with the document’s `institution_id`.

The model is split into three collections rather than a single nested document for the following reasons:

1. **Institutions** change slowly (name, activation). They are referenced by many users and many patient files.
2. **Users** have authentication and approval lifecycle data that must not be mixed with clinical records.
3. **Patient files** grow with images, detections, and dentist notes. Keeping them separate avoids bloating user documents and allows institution-scoped listing for dentists.

Images are stored outside MongoDB because:

- MongoDB documents have a 16 MB limit and are a poor fit for repeated high-resolution photos.
- Object storage supports private buckets and time-limited signed URLs.
- Paths are organised as `{institution_id}/{screening_id}/{angle}.jpg`, which scales cleanly across schools.

---

## 2. Entity relationship overview

```text
institutions 1 ──────── * users
      │                      │
      │                      │ created_by (staff)
      │                      ▼
      └────────────── * patient_files
                            │
                            └── images[]  →  Supabase object path
                            └── detections live on each image
```

| Relationship | How it is stored |
|--------------|------------------|
| User → institution | `users.institution_id` → `institutions._id` |
| Patient file → institution | `patient_files.institution_id` → `institutions._id` |
| Patient file → staff author | `patient_files.created_by` → `users._id` |
| Patient file → dentist notes | Written on the same `patient_files` document (`notes`, `validated_angles`) |
| Patient file → photographs | `patient_files.images[].storage_path` (Supabase key, not a binary blob) |

A dentist is linked to a school **only** through `users.institution_id`. There is no separate join table. When a dentist opens the dashboard, the API lists `patient_files` where `institution_id` matches that dentist’s institution.

---

## 3. Collection: `institutions`

Represents a school or partner health centre. Accounts cannot be created unless they reference an **active** institution.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | yes | Primary key |
| `name` | string | yes | Display name (unique) |
| `status` | string | yes | `active` or inactive; only `active` institutions appear at signup |
| `created_at` | datetime | no | Creation timestamp |

### Example

```json
{
  "_id": { "$oid": "66f000000000000000000001" },
  "name": "École Pilote Monastir",
  "status": "active",
  "created_at": { "$date": "2026-09-18T09:00:00.000Z" }
}
```

### Indexes

| Index | Unique | Purpose |
|-------|--------|---------|
| `name` | yes | Prevent duplicate institution names |

---

## 4. Collection: `users`

Represents platform accounts. One email maps to exactly one account. Staff and dentist are distinct roles; they cannot share the same email.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | yes | Primary key |
| `full_name` | string | yes | Display name |
| `email` | string | yes | Normalised (trimmed, lowercase); unique login identifier |
| `password_hash` | string | yes | Argon2 hash via `pwdlib`. Plain passwords are never stored |
| `role` | string | yes | `staff`, `dentist`, or `admin` |
| `institution_id` | ObjectId | yes | Foreign key to `institutions._id` |
| `status` | string | yes | Account lifecycle (see below) |
| `created_at` | datetime | yes | Registration time (UTC) |
| `updated_at` | datetime | yes | Last mutation time (UTC) |
| `validated_at` | datetime \| null | yes | Set when an admin activates the account |
| `validated_by` | ObjectId \| null | yes | Admin user who activated the account |

### Account status

| Value | Meaning |
|-------|---------|
| `pending` | Self-registered; cannot sign in until an administrator activates the account |
| `active` | May authenticate and use role-specific routes |
| `rejected` | Registration refused |
| `suspended` | Previously active; access revoked |

Signup only accepts `staff` or `dentist`. Admin accounts are provisioned out of band (direct insert). New self-service accounts always start as `pending`.

### Example

```json
{
  "_id": { "$oid": "66f000000000000000000010" },
  "full_name": "Amira Ben Salah",
  "email": "staff@ecole.tn",
  "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "role": "staff",
  "institution_id": { "$oid": "66f000000000000000000001" },
  "status": "active",
  "created_at": { "$date": "2026-09-18T09:10:00.000Z" },
  "updated_at": { "$date": "2026-09-18T09:20:00.000Z" },
  "validated_at": { "$date": "2026-09-18T09:20:00.000Z" },
  "validated_by": { "$oid": "66f000000000000000000099" }
}
```

### Indexes

| Index | Unique | Purpose |
|-------|--------|---------|
| `email` | yes | Login lookup; prevent duplicate accounts |
| `{ institution_id, role, status }` | no | Filter users of a school by role and approval state |

### Role behaviour (data access)

| Role | Creates patient files | Reads institution files | Writes clinical notes |
|------|----------------------|-------------------------|------------------------|
| `staff` | yes | no (no dashboard) | initial optional notes at save time |
| `dentist` | no | yes, same `institution_id` only | yes |
| `admin` | no | yes, same `institution_id` (current prototype) | yes; also activates users |

---

## 5. Collection: `patient_files`

Represents one screening episode for one child, created by school staff. This is the clinical record the partner dentist reviews.

Photographs are referenced by storage path. Bounding boxes from the YOLOv8 model are stored **next to each image**, not as a separate collection, because they have no meaning without that image.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | yes | Primary key; also used in the Supabase folder name |
| `institution_id` | ObjectId | yes | School that owns the record; copied from the staff user |
| `created_by` | ObjectId | yes | Staff user who ran the screening |
| `patient` | object | yes | Minimised identity block (see below) |
| `images` | array | yes | One entry per captured angle |
| `notes` | string | yes | Clinical / follow-up text; edited mainly by the dentist |
| `result` | string | yes | Human-readable triage summary (e.g. “Needs dentist review”) |
| `flagged_areas` | integer | yes | Count of AI detections across all angles |
| `validated_angles` | string[] | yes | Angles marked as reviewed by the dentist |
| `created_at` | datetime | yes | Save time (UTC) |
| `updated_at` | datetime | yes | Last notes / validation update (UTC) |

### `patient` subdocument

| Field | Type | Description |
|-------|------|-------------|
| `full_name` | string | Child’s name as entered by staff |
| `age` | integer | Age in years |
| `identity` | string | School ID, CIN, or local record number |

This is intentionally small. The prototype does not store address, parent contacts, or medical history. Additional personal data should only be added with a documented legal basis and consent process.

### `images[]` subdocument

| Field | Type | Description |
|-------|------|-------------|
| `angle` | string | `front`, `upper`, `lower`, `left`, or `right` |
| `label` | string | Display label (e.g. “Front bite”) |
| `storage_path` | string | Supabase object key |
| `content_type` | string | MIME type, typically `image/jpeg` |
| `detections` | array | Model outputs for this image |

### `detections[]` subdocument

Coordinates are **normalised** to `[0, 1]` relative to the original image width and height so overlays remain correct regardless of display size.

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Currently `caries` |
| `confidence` | number | Model score, typically 0–1 |
| `x` | number | Normalised left of the box |
| `y` | number | Normalised top of the box |
| `width` | number | Normalised box width |
| `height` | number | Normalised box height |

### Example

```json
{
  "_id": { "$oid": "66f000000000000000000200" },
  "institution_id": { "$oid": "66f000000000000000000001" },
  "created_by": { "$oid": "66f000000000000000000010" },
  "patient": {
    "full_name": "Youssef Trabelsi",
    "age": 9,
    "identity": "STU-2026-014"
  },
  "images": [
    {
      "angle": "front",
      "label": "Front bite",
      "storage_path": "66f000000000000000000001/66f000000000000000000200/front.jpg",
      "content_type": "image/jpeg",
      "detections": [
        {
          "label": "caries",
          "confidence": 0.873,
          "x": 0.241,
          "y": 0.318,
          "width": 0.126,
          "height": 0.142
        }
      ]
    }
  ],
  "notes": "",
  "result": "Needs dentist review",
  "flagged_areas": 1,
  "validated_angles": [],
  "created_at": { "$date": "2026-09-18T10:15:00.000Z" },
  "updated_at": { "$date": "2026-09-18T10:15:00.000Z" }
}
```

### Indexes

| Index | Unique | Purpose |
|-------|--------|---------|
| `{ institution_id, created_at: -1 }` | no | Dentist dashboard: newest files for one school |
| `created_by` | no | Trace screenings back to the staff member |

MongoDB does **not** enforce the foreign keys. The FastAPI layer validates ObjectIds and institution membership before insert or update.

---

## 6. Object storage (not MongoDB)

Bucket: `screening-images` (private).

Path convention:

```text
{institution_id}/{patient_file_id}/{angle}.{jpg|png}
```

The API never returns a permanent public URL. When a dentist loads a file, the backend issues a **signed URL** (one hour) using the service key held only on the server.

---

## 7. Data lifecycle

```text
1. Administrator inserts an institution (status = active).
2. Staff / dentist self-register → users.status = pending.
3. Administrator sets users.status = active.
4. Staff runs screening (YOLO on /detect) then saves → patient_files insert
   + image upload to Supabase.
5. Dentist of the same institution lists patient_files, adds notes,
   and marks validated_angles.
```

Indexes are created automatically at API startup (`ensure_indexes()` in `backend/database.py`). Collections themselves are created on first insert.

---

## 8. Health-data considerations

These records concern children. The current schema applies the following constraints:

- **Minimisation:** only name, age, and a local identifier are stored for the child.
- **No image blobs in MongoDB:** photographs stay in a private bucket.
- **Tenant isolation:** dentists cannot query another institution’s `patient_files`.
- **Hashed credentials:** passwords are stored as Argon2 hashes.
- **Approval gate:** no screening access until an administrator activates the account.

This is a prototype. A production deployment should add consent records, retention / deletion policy, encryption at rest (MongoDB and Supabase), audit logs, and a formal data-protection assessment.

---

## 9. Bootstrap data (development)

Institutions and the first admin are not created by signup. Typical seed:

```javascript
use dentalscreen

db.institutions.insertOne({
  name: "École Pilote Monastir",
  status: "active",
  created_at: new Date()
})

// Activate a pending user after self-registration:
db.users.updateOne(
  { email: "staff@ecole.tn" },
  { $set: { status: "active", validated_at: new Date() } }
)
```

---

## 10. Source of truth in code

| Concern | File |
|---------|------|
| Connection, collections, indexes | `backend/database.py` |
| User and institution writes | `backend/main.py` (`/auth/*`, `/institutions`) |
| Patient file writes and institution-scoped reads | `backend/main.py` (`/screenings*`) |
| Object path helpers | `backend/storage.py` |
| Runtime configuration | `backend/config.py`, `backend/.env` |
