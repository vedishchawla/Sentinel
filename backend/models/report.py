"""Resolution report models."""

from pydantic import BaseModel, Field
from typing import Optional


class ReportMetrics(BaseModel):
    """Key metrics from a resolution."""
    confidence: float = Field(description="Agent confidence score 0-100")
    risk_level: str = Field(description="low / medium / high")
    files_changed: int = Field(default=0)
    lines_added: int = Field(default=0)
    lines_removed: int = Field(default=0)
    tests_generated: int = Field(default=0)
    tests_passed: int = Field(default=0)
    tests_failed: int = Field(default=0)
    coverage: Optional[float] = None


class ResolutionReport(BaseModel):
    """Complete resolution report for an incident."""
    incident_id: str
    root_cause: str
    fix_description: str
    files_modified: list[str]
    changes_summary: str
    test_summary: str
    validation_result: str
    metrics: ReportMetrics
    risk_assessment: list[str]
    pr_url: Optional[str] = None
