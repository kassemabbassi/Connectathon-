from functools import lru_cache

from fastapi import HTTPException

from config import settings

ALLOWED_ANGLES = {"front", "upper", "lower", "left", "right"}
ANGLE_LABELS = {
    "front": "Front bite",
    "upper": "Upper arch",
    "lower": "Lower arch",
    "left": "Left side",
    "right": "Right side",
}
SIGNED_URL_SECONDS = 60 * 60


@lru_cache(maxsize=1)
def supabase_client():
    if not settings.supabase_url or not settings.supabase_service_key:
        raise HTTPException(
            status_code=503,
            detail="Image storage is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.",
        )
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_service_key)


def image_storage_path(institution_id: str, screening_id: str, angle: str, extension: str = "jpg") -> str:
    return f"{institution_id}/{screening_id}/{angle}.{extension}"


def upload_screening_image(path: str, content: bytes, content_type: str) -> None:
    options = {
        "content-type": content_type or "image/jpeg",
        "upsert": "true",
    }
    try:
        supabase_client().storage.from_(settings.supabase_bucket).upload(path, content, file_options=options)
    except Exception as error:
        message = str(error)
        raise HTTPException(
            status_code=502,
            detail=f"Unable to store the screening image in Supabase. {message}",
        ) from error


def signed_image_url(path: str) -> str:
    try:
        result = supabase_client().storage.from_(settings.supabase_bucket).create_signed_url(
            path,
            SIGNED_URL_SECONDS,
        )
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to create a signed image URL. {error}",
        ) from error

    url = None
    if isinstance(result, dict):
        url = result.get("signedURL") or result.get("signedUrl") or result.get("signed_url")
    else:
        url = getattr(result, "signed_url", None) or getattr(result, "signedURL", None)

    if not url:
        raise HTTPException(status_code=502, detail="Supabase did not return a signed image URL.")
    if url.startswith("/"):
        return f"{settings.supabase_url.rstrip('/')}{url}"
    return url
