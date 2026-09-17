import os
import sys
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# Ensure test env vars
os.environ["AI_SERVICE_SECRET"] = "test-secret-key-12345"
os.environ["AI_MODEL_NAME"] = "sentence-transformers/all-MiniLM-L6-v2"
os.environ["AI_CONFIDENCE_THRESHOLD"] = "0.65"
os.environ["TOP_K"] = "3"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SECRET_KEY"] = "test-supabase-key"

from app.main import app
from app.services.model_service import model_service
from app.services.department_service import department_service

client = TestClient(app)

MOCK_DEPARTMENTS = [
    {
        "id": "1",
        "name": "Water Supply",
        "code": "WATER",
        "description": "Drinking water supply, pipeline leakages, contaminated water, tap water pressure issues, water tankers and billing disputes.",
        "is_active": True
    },
    {
        "id": "2",
        "name": "Electricity",
        "code": "POWER",
        "description": "Power outages, electric pole sparking, power cuts, transformer failure, billing and smart meter faults, street lights not functioning.",
        "is_active": True
    },
    {
        "id": "3",
        "name": "Roads & Transport",
        "code": "ROADS",
        "description": "Potholes on roads, damaged highways, broken traffic signals, missing signboards, public bus schedule and bus stop maintenance.",
        "is_active": True
    },
    {
        "id": "4",
        "name": "Sanitation",
        "code": "SAN",
        "description": "Uncollected garbage, open drainage overflow, waste dumping, public toilet cleaning, vector mosquito fogging and street sweeping.",
        "is_active": True
    }
]

# Helper to populate department_service with mock departments & embeddings
def setup_mock_departments(dept_list):
    department_service._departments = dept_list
    if dept_list:
        docs = [
            f"{d.get('name', '')}: {d.get('description', '')}"
            for d in dept_list
        ]
        department_service._department_embeddings = model_service.encode(docs)
    else:
        department_service._department_embeddings = None

# 1. Health Endpoint Test
def test_health_endpoint():
    model_service.load_model()
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_name"] == "sentence-transformers/all-MiniLM-L6-v2"
    assert "departments_count" in data
    assert data["model_loaded"] is True

# 2. Missing Authorization
def test_routing_missing_auth():
    payload = {
        "subject": "Street light issue",
        "description": "The street light in our area is broken and sparking."
    }
    response = client.post("/api/v1/route", json=payload)
    assert response.status_code == 401
    assert "Missing or malformed Authorization header" in response.json()["detail"]

# 3. Invalid Authorization
def test_routing_invalid_auth():
    payload = {
        "subject": "Street light issue",
        "description": "The street light in our area is broken and sparking."
    }
    headers = {"Authorization": "Bearer wrong-invalid-secret"}
    response = client.post("/api/v1/route", json=payload, headers=headers)
    assert response.status_code == 401
    assert "Invalid AI Service Secret credentials" in response.json()["detail"]

# 4. Empty Subject Rejection
def test_routing_empty_subject():
    payload = {
        "subject": "   ",
        "description": "The street light in our area is broken."
    }
    headers = {"Authorization": "Bearer test-secret-key-12345"}
    response = client.post("/api/v1/route", json=payload, headers=headers)
    assert response.status_code == 422

# 5. Empty Description Rejection
def test_routing_empty_description():
    payload = {
        "subject": "Street light broken",
        "description": "   "
    }
    headers = {"Authorization": "Bearer test-secret-key-12345"}
    response = client.post("/api/v1/route", json=payload, headers=headers)
    assert response.status_code == 422

# 6. Valid Grievance Routing & High Confidence Prediction & Top-K ordering
def test_valid_grievance_high_confidence():
    setup_mock_departments(MOCK_DEPARTMENTS)
    
    payload = {
        "subject": "Frequent electricity cuts and transformer sparks",
        "description": "There is a severe power outage since yesterday and the local transformer is sparking dangerously with voltage fluctuations."
    }
    headers = {"Authorization": "Bearer test-secret-key-12345"}
    response = client.post("/api/v1/route", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_department"] == "Electricity"
    assert data["confidence_score"] >= 0.65
    assert data["routing_status"] == "completed"
    assert len(data["top_predictions"]) <= 3
    # Check Top-K descending sort
    scores = [p["score"] for p in data["top_predictions"]]
    assert scores == sorted(scores, reverse=True)
    assert data["model_name"] == "sentence-transformers/all-MiniLM-L6-v2"
    assert data["model_version"] == "1.0"

# 7. Low Confidence Prediction (Ambiguous or Irrelevant text)
def test_low_confidence_prediction():
    setup_mock_departments(MOCK_DEPARTMENTS)
    
    payload = {
        "subject": "Random unrelated query",
        "description": "What is the capital city of France and why is quantum mechanics fascinating?"
    }
    headers = {"Authorization": "Bearer test-secret-key-12345"}
    response = client.post("/api/v1/route", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    # Below threshold of 0.65
    assert data["confidence_score"] < 0.65
    assert data["routing_status"] == "flagged_for_review"
    assert "top_predictions" in data

# 8. No Active Departments Rejection
def test_no_active_departments():
    # Set empty departments
    department_service._departments = []
    department_service._department_embeddings = None
    
    # Mock load_departments raising ValueError
    with patch.object(department_service, "load_departments", side_effect=ValueError("No active departments available in database for semantic routing.")):
        payload = {
            "subject": "Water pipe leak",
            "description": "Main water pipeline is leaking on 5th cross road."
        }
        headers = {"Authorization": "Bearer test-secret-key-12345"}
        response = client.post("/api/v1/route", json=payload, headers=headers)
        assert response.status_code == 503
        assert "No active departments" in response.json()["detail"]
