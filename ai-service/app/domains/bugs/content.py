def compose_bug_text(title: str | None, description: str | None) -> str:
    clean_title = (title or "").strip()
    clean_description = (description or "").strip()
    return f"{clean_title}. {clean_description}".strip()
