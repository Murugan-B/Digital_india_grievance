from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class RoutingRequest(BaseModel):
    subject: str = Field(..., min_length=2, description="Grievance subject")
    description: str = Field(..., min_length=5, description="Detailed grievance description")
    category: Optional[str] = Field(None, description="Optional citizen-selected category or service area")
    location: Optional[str] = Field(None, description="Optional location / district / area")
    preferred_language: Optional[str] = Field(None, description="Optional preferred language code (en, ta, hi, etc.)")

    @field_validator("subject", "description")
    @classmethod
    def check_not_whitespace(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or contain only whitespace")
        return v.strip()

class TopPrediction(BaseModel):
    department: str
    code: str
    score: float
    semantic_score: float
    routing_score: float

class RoutingResponse(BaseModel):
    predicted_department: str
    confidence_score: float
    semantic_score: float
    routing_score: float
    routing_status: str  # "completed" | "flagged_for_review"
    top_predictions: List[TopPrediction]
    model_name: str
    model_version: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    departments_count: int
