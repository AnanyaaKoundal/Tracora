def compose_project_text(name: str | None, description: str | None) -> str:
    clean_name = (name or "").strip()
    clean_description = (description or "").strip()
    return f"{clean_name}. {clean_description}".strip()
