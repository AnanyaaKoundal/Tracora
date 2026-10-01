from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mongo_uri: str
    mongo_db: str | None = None

    ollama_host: str = "http://localhost:11434"
    ollama_chat_model: str = "llama3.2"
    ollama_embed_model: str = "nomic-embed-text"

    # --- chat backend selection ---
    # One of: ollama | groq | hf | openai | auto
    # "auto" walks llm_fallback_order and skips anything without a credential.
    llm_backend: str = "ollama"
    llm_fallback_order: str = "groq,hf,ollama"
    llm_timeout_seconds: float = 180.0
    llm_temperature: float = 0.2
    # Structured-output strict mode. Requires every property to be listed in
    # "required"; leave off for schemas that model optional fields.
    llm_strict_schema: bool = False

    groq_model: str = "openai/gpt-oss-120b"
    groq_api_key: str = ""

    hf_model: str = "openai/gpt-oss-120b"
    # Pin a provider (e.g. "deepinfra") because supports_structured_output varies by
    # provider, not by model. Blank uses the router's default routing.
    hf_provider: str = ""
    hf_token: str = ""

    openai_model: str = "gpt-4.1-nano"
    openai_api_key: str = ""
    # Hard gate: paid backends are only ever used when this is true, so a free tier
    # hitting its limit can't silently start spending money.
    llm_allow_paid: bool = False

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "tracora_entities"

    duplicate_threshold: float = 0.70
    duplicate_limit: int = 3

    # Retrieval below this score is reported to the model as a weak hit rather than
    # as a match. Hits are still returned and shown; they are just not allowed to be
    # described as "the same bug".
    similar_strong_threshold: float = 0.70

    # A project reference is resolved by exact name, then substring, then embedding
    # similarity. The semantic step is the only fuzzy one, so these gate only that
    # step: below min_score the reference is treated as not a project, and a top two
    # gap under margin is reported as ambiguous so the assistant asks instead of
    # guessing. Both are tunable against the eval set, not constants.
    project_match_min_score: float = 0.60
    project_match_margin: float = 0.05


settings = Settings()
