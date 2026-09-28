from fastapi import APIRouter, HTTPException

from app.domains.agent.loop import AgentError, run_turn
from app.models.agent import AgentTurnRequest, AgentTurnResponse

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/turn", response_model=AgentTurnResponse)
def turn(payload: AgentTurnRequest) -> AgentTurnResponse:
    try:
        reply, steps = run_turn(
            message=payload.message,
            company_id=payload.company_id,
            context=payload.context,
        )
    except AgentError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Agent unavailable: {exc}") from exc

    return AgentTurnResponse(reply=reply, steps=steps)
