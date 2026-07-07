from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: str = "development"
    cors_origins: str = "http://localhost:3000"
    database_url: str = "postgresql://akpathshala:akpathshala@localhost:5432/akpathshala"

    jwt_secret: str = "change-me-in-production"
    jwt_refresh_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    access_token_cookie: str = "access_token"
    refresh_token_cookie: str = "refresh_token"

    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_bucket_cdc_documents: str = "cdc-documents"

    max_pdf_upload_size_mb: int = 30
    extraction_text_threshold_chars_per_page: int = 50
    ocr_confidence_threshold: float = 0.6

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cookie_secure(self) -> bool:
        return self.env != "development"


settings = Settings()
