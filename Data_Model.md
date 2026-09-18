# SpotEarly Data Model

SpotEarly uses **MongoDB** for application data and **Supabase Storage** for dental images. This separation keeps database records compact, makes image access private, and supports secure review across multiple institutions.

## Overview

| Store | Purpose |
| --- | --- |
| MongoDB database: `dentalscreen` | Institutions, user accounts, anonymous screening records, AI findings, consent metadata, and review state. |
| Supabase bucket: `screening-images` | Original intraoral images. Images are not stored as MongoDB binary data. |

The platform has three MongoDB collections:

```text
institutions 1 ──── * users
      │
      └──── * patient_files ──── * images stored in Supabase
```

Every user and every screening file belongs to one institution. The API checks this relationship before allowing a user to read or update a screening file.

## Collections

### `institutions`

Represents a school or partner health organization.

| Field | Type | Description |
| --- | --- | --- |
| `_id` | `ObjectId` | Unique institution identifier. |
| `name` | string | Institution display name; unique. |
| `status` | string | Current availability, normally `active`. |
| `created_at` | datetime | Creation time in UTC. |

Only administrators create institutions. A staff or dentist account can only be created for an active institution.

### `users`

Stores platform accounts. Passwords are stored as Argon2 hashes, never as plaintext.

| Field | Type | Description |
| --- | --- | --- |
| `_id` | `ObjectId` | Unique user identifier. |
| `full_name` | string | Account holder's display name. |
| `email` | string | Normalized email address; unique. |
| `password_hash` | string | Argon2 password hash. |
| `role` | string | `admin`, `staff`, or `dentist`. |
| `institution_id` | `ObjectId` | Institution for staff and dentists. |
| `status` | string | `pending`, `active`, `rejected`, or `suspended`. |
| `created_at`, `updated_at` | datetime | Account lifecycle timestamps. |
| `validated_at`, `validated_by` | datetime, `ObjectId` | Activation audit fields when applicable. |

Administrators create active staff and dentist accounts from the admin workspace. The status fields also support controlled activation or suspension through the API.

### `patient_files`

Stores one anonymous screening record and its review state. The record never needs a child's name, date of birth, or government/student identifier.

| Field | Type | Description |
| --- | --- | --- |
| `_id` | `ObjectId` | Unique screening/file identifier. |
| `institution_id` | `ObjectId` | Tenant boundary for the screening. |
| `created_by` | `ObjectId` | Staff account that saved the screening. |
| `patient.code` | string | Non-identifying patient code. |
| `consent` | object | Guardian confirmation time and legal reference. |
| `images` | array | Per-angle image metadata, storage path, and model detections. |
| `notes` | string | Dentist review notes. |
| `result`, `flagged_areas` | string, number | Screening summary and number of flagged regions. |
| `validated_angles` | string array | Image angles reviewed by a dentist. |
| `file_validated` | boolean | Whether the complete file received clinical validation. |
| `validated_at`, `validated_by` | datetime, `ObjectId` | Complete-file validation audit fields. |
| `created_at`, `updated_at` | datetime | Record lifecycle timestamps. |
| `delete_after` | datetime | Retention deadline used by MongoDB's TTL index. |

Each `images` item contains an allowed angle (`front`, `upper`, `lower`, `left`, or `right`), its display label, content type, private storage path, and the model's normalized detections. A detection has a `label`, `confidence`, `x`, `y`, `width`, and `height`.

## Image Storage

Images are saved in the private Supabase bucket under this predictable key:

```text
{institution_id}/{screening_id}/{angle}.{jpg|png}
```

The backend uploads and deletes objects with its server-side Supabase key. When an authorized user reviews a file, the API returns a signed URL that expires after one hour. Permanent public image URLs are not used.

## Access Control and Privacy

- A session identifies the current user and their role.
- API routes enforce permitted roles (`admin`, `staff`, or `dentist`) server-side.
- The API compares `institution_id` on the user and the screening record for every screening read, update, validation, and deletion.
- Staff can create and run detection for their own institution; dentists review files from their own institution.
- Guardian confirmation is required before a minor's screening can be stored.
- Image objects are private; only signed links are returned to authorized clients.

MongoDB does not enforce foreign keys. FastAPI validates identifiers, user roles, institution membership, and record ownership rules before writing data.

## Indexes and Retention

Indexes are created automatically when the API starts:

| Collection | Index | Purpose |
| --- | --- | --- |
| `users` | Unique `email` | Prevent duplicate accounts. |
| `users` | `institution_id`, `role`, `status` | Efficient account and permission queries. |
| `institutions` | Unique `name` | Prevent duplicate institutions. |
| `patient_files` | `institution_id`, `created_at` descending | Efficient institution dashboard listing. |
| `patient_files` | `created_by` | Efficient author lookup. |
| `patient_files` | TTL on `delete_after` | Automatically removes expired database records. |

The MongoDB TTL index removes expired documents asynchronously. Configure a corresponding Supabase lifecycle/deletion process for image objects so object retention matches database retention.

## Configuration and Source Files

| Concern | File |
| --- | --- |
| MongoDB connection and indexes | [backend/database.py](backend/database.py) |
| Application settings | [backend/config.py](backend/config.py) |
| Database writes and access rules | [backend/main.py](backend/main.py) |
| Password/session/role security | [backend/auth.py](backend/auth.py) |
| Supabase storage and signed URLs | [backend/storage.py](backend/storage.py) |

Local defaults are `mongodb://127.0.0.1:27017` and database `dentalscreen`. Configure production credentials and Supabase values through `backend/.env`; never commit secrets or a Supabase service key.
