from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.core.logging import Stage, log, request_id
from app.domains.agent.loop import AgentError, run_turn
from app.models.agent import AgentTurnRequest, AgentTurnResponse

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/turn", response_model=AgentTurnResponse)
def turn(payload: AgentTurnRequest) -> AgentTurnResponse:
    rid = uuid4().hex[:8]
    token = request_id.set(rid)
    log("turn.start", "agent turn")
    try:
        with Stage("turn"):
            reply, steps = run_turn(
                message=payload.message,
                company_id=payload.company_id,
                project_id=payload.project_id,
                context=payload.context,
                history=[turn.model_dump() for turn in payload.history],
            )
    except AgentError as exc:
        log("turn.error", "agent error", error=str(exc)[:300])
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        log("turn.error", "agent unavailable", error=f"{type(exc).__name__}: {exc}")
        raise HTTPException(status_code=503, detail=f"Agent unavailable: {exc}") from exc
    finally:
        request_id.reset(token)

    log("turn.done", "turn complete", steps=len(steps), reply_chars=len(reply))
    return AgentTurnResponse(reply=reply, steps=steps)
