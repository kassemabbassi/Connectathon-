from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://127.0.0.1:27017"
    mongo_db: str = "dentalscreen"
    jwt_secret: str = "change-this-development-secret"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_bucket: str = "screening-images"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("supabase_url")
    @classmethod
    def clean_supabase_url(cls, value: str) -> str:
        cleaned = value.strip()
        while cleaned.startswith("."):
            cleaned = cleaned[1:]
        return cleaned


settings = Settings()