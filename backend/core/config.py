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

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cookie_secure(self) -> bool:
        return self.env != "development"


settings = Settings()
