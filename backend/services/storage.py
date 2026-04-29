"""
SQLite Storage Service — persistent incident history.
"""

import aiosqlite
import json
from typing import Optional
from models.incident import Incident, IncidentStatus


class StorageService:
    """Async SQLite-based storage for incidents."""

    def __init__(self, db_path: str = "sentinel.db"):
        self.db_path = db_path

    async def initialize(self):
        """Create tables if they don't exist."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id TEXT PRIMARY KEY,
                    description TEXT NOT NULL,
                    repo_url TEXT NOT NULL,
                    environment TEXT DEFAULT 'production',
                    status TEXT DEFAULT 'pending',
                    error_type TEXT,
                    module TEXT,
                    root_cause TEXT,
                    fix_description TEXT,
                    diff TEXT,
                    tests_generated TEXT,
                    test_results TEXT,
                    pr_url TEXT,
                    pr_number INTEGER,
                    confidence REAL,
                    resolution_time TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    file_tree TEXT,
                    relevant_files TEXT,
                    reasoning_log TEXT
                )
            """)
            await db.commit()

    async def create_incident(self, incident: Incident) -> Incident:
        """Insert a new incident."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """INSERT INTO incidents (
                    id, description, repo_url, environment, status,
                    error_type, module, root_cause, fix_description, diff,
                    tests_generated, test_results, pr_url, pr_number,
                    confidence, resolution_time, created_at, completed_at,
                    file_tree, relevant_files, reasoning_log
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    incident.id, incident.description, incident.repo_url,
                    incident.environment, incident.status.value,
                    incident.error_type, incident.module, incident.root_cause,
                    incident.fix_description, incident.diff,
                    incident.tests_generated, incident.test_results,
                    incident.pr_url, incident.pr_number,
                    incident.confidence, incident.resolution_time,
                    incident.created_at, incident.completed_at,
                    incident.file_tree, incident.relevant_files,
                    incident.reasoning_log,
                ),
            )
            await db.commit()
        return incident

    async def update_incident(self, incident_id: str, **kwargs) -> Optional[Incident]:
        """Update specific fields of an incident."""
        if not kwargs:
            return None

        set_clause = ", ".join(f"{k} = ?" for k in kwargs.keys())
        values = list(kwargs.values())
        values.append(incident_id)

        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                f"UPDATE incidents SET {set_clause} WHERE id = ?",
                values,
            )
            await db.commit()

        return await self.get_incident(incident_id)

    async def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Get a single incident by ID."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM incidents WHERE id = ?", (incident_id,)
            ) as cursor:
                row = await cursor.fetchone()
                if row:
                    return Incident(**dict(row))
        return None

    async def list_incidents(self, limit: int = 50, offset: int = 0) -> list[Incident]:
        """List incidents ordered by creation time (newest first)."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM incidents ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            ) as cursor:
                rows = await cursor.fetchall()
                return [Incident(**dict(row)) for row in rows]

    async def get_incident_count(self) -> int:
        """Get total number of incidents."""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT COUNT(*) FROM incidents") as cursor:
                row = await cursor.fetchone()
                return row[0] if row else 0
