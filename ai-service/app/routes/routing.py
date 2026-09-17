import logging
from fastapi import APIRouter, Header, HTTPException, status, Depends
from typing import Optional
from app.config import settings
from app.schemas import RoutingRequest, RoutingResponse
from app.services.department_service import department_service

logger = logging.getLogger("ai-service.routes")
router = APIRouter(prefix="/api/v1", tags=["Routing"])

def verify_internal_auth(authorization: Optional[str] = Header(None)) -> bool:
    """
    Validates internal microservice Bearer token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Internal AI Service Secret required."
        )
    
    token = authorization.split(" ")[1].strip()
    if token != settings.AI_SERVICE_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid AI Service Secret credentials."
        )
    return True

@router.post(
    "/route",
    response_model=RoutingResponse,
    summary="Semantically classify grievance and predict department",
    dependencies=[Depends(verify_internal_auth)]
)
def route_grievance(payload: RoutingRequest):
    try:
        logger.info(f"Processing semantic routing for grievance subject: '{payload.subject[:50]}...'")
        result = department_service.route_grievance(
            subject=payload.subject,
            description=payload.description,
            category=payload.category,
            location=payload.location,
            preferred_language=payload.preferred_language
        )
        logger.info(
            f"Prediction: '{result.predicted_department}' | Score: {result.confidence_score} | Semantic: {result.semantic_score} | Status: {result.routing_status}"
        )
        return result
    except ValueError as ve:
        logger.error(f"Validation or department error during routing: {str(ve)}")
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE if "No active departments" in str(ve) else status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=status_code,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Unexpected error during semantic routing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred in the AI semantic routing engine."
        )
