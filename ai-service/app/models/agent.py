from typing import Any

from pydantic import BaseModel, Field


class AgentTurnRequest(BaseModel):
    message: str = Field(min_length=1)
    context: dict[str, Any] | None = None
    company_id: str = Field(min_length=1)
    # Accepted for contract stability across services. Unused while the only tool is
    # retrieval; nothing in the agent path authorises anything from it.
    user_id: str | None = None


class AgentTurnResponse(BaseModel):
    reply: str
    steps: list[str] = Field(default_factory=list)
