from typing import Any, Literal

from pydantic import BaseModel, Field


class HistoryTurn(BaseModel):
    """One earlier message in the conversation.

    `role` is constrained rather than a free string so a client cannot inject a
    "system" turn and rewrite the agent's instructions. Length caps stop a turn
    being padded to blow up the token budget.
    """

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AgentTurnRequest(BaseModel):
    message: str = Field(min_length=1)
    # Capped server-side regardless of what the client sends. Sent with the request,
    # not stored: nothing is persisted and nothing survives a page refresh.
    history: list[HistoryTurn] = Field(default_factory=list, max_length=4)
    context: dict[str, Any] | None = None
    company_id: str = Field(min_length=1)
    # Optional sticky project scope from the UI. It narrows bug search within the
    # company; the company itself still comes from the authenticated request. An
    # explicit project named in the message overrides this.
    project_id: str | None = None
    # Accepted for contract stability across services. Unused while the only tool is
    # retrieval; nothing in the agent path authorises anything from it.
    user_id: str | None = None


class AgentTurnResponse(BaseModel):
    reply: str
    steps: list[str] = Field(default_factory=list)
