"""Pipeline step models and WebSocket message protocol."""

from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum


class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class PipelineStep(BaseModel):
    """A single pipeline step's status."""
    id: str
    label: str
    status: StepStatus = StepStatus.PENDING
    duration: Optional[float] = None


class MessageType(str, Enum):
    """Types of WebSocket messages sent from backend to frontend."""
    # Pipeline control
    STEP_UPDATE = "step_update"       # Step status changed
    TERMINAL = "terminal"             # Terminal output line
    REASONING = "reasoning"           # Agent reasoning thought
    PROGRESS = "progress"             # Overall progress percentage

    # Data payloads (sent when a step completes)
    FILE_TREE = "file_tree"           # Analyzed file tree structure
    CODE_ANALYSIS = "code_analysis"   # Buggy code + annotations
    DIFF = "diff"                     # Generated fix diff
    TESTS = "tests"                   # Generated tests + results
    PR_DATA = "pr_data"              # PR metadata
    REPORT = "report"                 # Final resolution report

    # Control
    COMPLETE = "complete"             # Pipeline finished
    ERROR = "error"                   # Fatal error


class PipelineMessage(BaseModel):
    """WebSocket message from backend to frontend."""
    type: MessageType
    data: Any = None
    step_id: Optional[str] = None
    timestamp: Optional[str] = None
