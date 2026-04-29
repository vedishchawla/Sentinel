"""Pydantic models for incident data."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class IncidentStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FAILED = "failed"


class IncidentCreate(BaseModel):
    """Payload from the frontend to start a new incident resolution."""
    description: str = Field(..., min_length=1, description="Incident description or ticket URL")
    repo_url: str = Field(..., description="GitHub repository URL")
    environment: str = Field(default="production", description="Target environment")


class Incident(BaseModel):
    """Full incident record stored in the database."""
    id: str = Field(..., description="Unique incident ID")
    description: str
    repo_url: str
    environment: str
    status: IncidentStatus = IncidentStatus.PENDING
    error_type: Optional[str] = None
    module: Optional[str] = None
    root_cause: Optional[str] = None
    fix_description: Optional[str] = None
    diff: Optional[str] = None
    tests_generated: Optional[str] = None
    test_results: Optional[str] = None
    pr_url: Optional[str] = None
    pr_number: Optional[int] = None
    confidence: Optional[float] = None
    resolution_time: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None
    file_tree: Optional[str] = None  # JSON string of analyzed file tree
    relevant_files: Optional[str] = None  # JSON string of relevant file paths
    reasoning_log: Optional[str] = None  # JSON string of reasoning entries
