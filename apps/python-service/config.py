from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    INTERNAL_SECRET: str = Field(min_length=32)
    GROQ_API_KEY: str = "" # Default empty, can be supplied via BYOK later
    REDIS_URL: str = "redis://localhost:6379"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
