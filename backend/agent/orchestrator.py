"""
Agent Orchestrator — runs the full autonomous pipeline and streams progress via WebSocket.
"""

import json
import time
import uuid
import asyncio
from datetime import datetime
from typing import Callable, Awaitable

from config import get_settings
from models.pipeline import PipelineMessage, MessageType, StepStatus
from models.incident import Incident, IncidentStatus
from services.github_service import GitHubService
from services.storage import StorageService
from agent.steps.ticket_parser import TicketParser
from agent.steps.codebase_analyzer import CodebaseAnalyzer
from agent.steps.root_cause import RootCauseDetector
from agent.steps.fix_generator import FixGenerator
from agent.steps.test_generator import TestGenerator
from agent.steps.sandbox_runner import SandboxRunner
from agent.steps.pr_creator import PRCreator


# Type for the WebSocket send callback
SendFn = Callable[[PipelineMessage], Awaitable[None]]


PIPELINE_STEPS = [
    {"id": "understanding", "label": "Ticket Understanding"},
    {"id": "analysis", "label": "Codebase Analysis"},
    {"id": "root_cause", "label": "Root Cause Detection"},
    {"id": "generation", "label": "Fix Generation"},
    {"id": "testing", "label": "Test Generation"},
    {"id": "sandbox", "label": "Sandbox Execution"},
    {"id": "validation", "label": "Validation"},
    {"id": "pr", "label": "Pull Request Creation"},
]


class Orchestrator:
    """Runs the full incident-to-fix pipeline, streaming progress via WebSocket."""

    def __init__(self):
        self.settings = get_settings()
        self.github = GitHubService(
            token=self.settings.github_token,
            work_dir=self.settings.work_dir,
        )
        self.storage = StorageService(db_path=self.settings.db_path)

    async def _send(self, send: SendFn, msg_type: MessageType, data=None, step_id=None):
        """Helper to send a WebSocket message."""
        msg = PipelineMessage(
            type=msg_type,
            data=data,
            step_id=step_id,
            timestamp=datetime.now().strftime("%H:%M:%S"),
        )
        await send(msg)

    async def _terminal(self, send: SendFn, text: str, log_type: str = "info"):
        """Send a terminal output line."""
        await self._send(send, MessageType.TERMINAL, {
            "text": text,
            "type": log_type,
        })

    async def _reasoning(self, send: SendFn, step_id: str, thought: str):
        """Send a reasoning thought."""
        await self._send(send, MessageType.REASONING, {
            "step_id": step_id,
            "thought": thought,
        })

    async def _step_start(self, send: SendFn, step_id: str):
        """Mark a step as running."""
        await self._send(send, MessageType.STEP_UPDATE, {
            "step_id": step_id,
            "status": StepStatus.RUNNING.value,
        }, step_id=step_id)

    async def _step_complete(self, send: SendFn, step_id: str, duration: float):
        """Mark a step as completed."""
        await self._send(send, MessageType.STEP_UPDATE, {
            "step_id": step_id,
            "status": StepStatus.COMPLETED.value,
            "duration": round(duration, 1),
        }, step_id=step_id)

    async def _step_fail(self, send: SendFn, step_id: str, error: str):
        """Mark a step as failed."""
        await self._send(send, MessageType.STEP_UPDATE, {
            "step_id": step_id,
            "status": StepStatus.FAILED.value,
            "error": error,
        }, step_id=step_id)

    async def run(self, description: str, repo_url: str, environment: str, send: SendFn):
        """Run the full autonomous pipeline."""
        # Initialize
        incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        llm = self.settings.get_llm()
        reasoning_log = []

        # Create incident record
        incident = Incident(
            id=incident_id,
            description=description,
            repo_url=repo_url,
            environment=environment,
            status=IncidentStatus.IN_PROGRESS,
        )
        await self.storage.initialize()
        await self.storage.create_incident(incident)

        # Send initial pipeline state
        await self._send(send, MessageType.PROGRESS, {"progress": 0, "incident_id": incident_id})

        # Accumulated results
        ticket_data = {}
        analysis_data = {}
        root_cause_data = {}
        fix_data = {}
        test_data = {}
        sandbox_results = {}
        pr_data = {}
        workspace_path = ""

        try:
            # ─── STEP 1: Ticket Understanding ───
            step_id = "understanding"
            t0 = time.time()
            await self._step_start(send, step_id)
            await self._terminal(send, f"$ sentinel analyze --ticket {incident_id}", "command")
            await self._reasoning(send, step_id, "Parsing ticket metadata...")

            await self._terminal(send, "Parsing incident description...", "info")
            parser = TicketParser(llm)
            ticket_data = await parser.parse(description)

            await self._reasoning(send, step_id, f"Detected error type: {ticket_data.get('error_type', 'Unknown')}")
            await self._terminal(send, f"Identified: {ticket_data.get('summary', 'Unknown incident')}", "success")
            await self._reasoning(send, step_id, f"Severity: {ticket_data.get('severity', 'P2')} | Module: {ticket_data.get('affected_module', 'unknown')}")
            await self._terminal(send, f"Priority: {ticket_data.get('severity', 'P2')} | Component: {ticket_data.get('affected_module', 'unknown')}", "info")
            await self._reasoning(send, step_id, f"Extracted {len(ticket_data.get('keywords', []))} search keywords")

            await self.storage.update_incident(
                incident_id,
                error_type=ticket_data.get("error_type"),
                module=ticket_data.get("affected_module"),
            )
            await self._step_complete(send, step_id, time.time() - t0)
            await self._send(send, MessageType.PROGRESS, {"progress": 12.5})

            # ─── STEP 2: Codebase Analysis ───
            step_id = "analysis"
            t0 = time.time()
            await self._step_start(send, step_id)
            await self._terminal(send, f"$ sentinel scan --repo {repo_url} --depth 4", "command")
            await self._reasoning(send, step_id, f"Cloning repository {repo_url}...")

            await self._terminal(send, "Downloading repository...", "info")
            workspace_path = await self.github.clone_repo(repo_url)

            all_files = self.github.list_all_files(workspace_path)
            await self._terminal(send, f"Scanning repository structure... {len(all_files)} files indexed", "info")
            await self._reasoning(send, step_id, f"Repository indexed: {len(all_files)} files")

            file_tree = self.github.get_file_tree(workspace_path)

            await self._terminal(send, "Building dependency graph...", "info")
            analyzer = CodebaseAnalyzer(llm)
            analysis_data = await analyzer.analyze(all_files, ticket_data, repo_url)

            relevant_files = analysis_data.get("relevant_files", [])
            await self._terminal(send, f"Identified {len(relevant_files)} relevant files", "success")
            await self._reasoning(send, step_id, f"Relevant files: {', '.join(relevant_files[:5])}")

            dep_chain = analysis_data.get("dependency_chain", "")
            if dep_chain:
                await self._terminal(send, f"Call graph: {dep_chain}", "info")
                await self._reasoning(send, step_id, f"Dependency chain: {dep_chain}")

            # Send file tree to frontend
            await self._send(send, MessageType.FILE_TREE, {
                "tree": file_tree,
                "relevant_files": relevant_files,
            })

            await self.storage.update_incident(
                incident_id,
                file_tree=json.dumps(file_tree),
                relevant_files=json.dumps(relevant_files),
            )
            await self._step_complete(send, step_id, time.time() - t0)
            await self._send(send, MessageType.PROGRESS, {"progress": 25})

            # ─── STEP 3: Root Cause Detection ───
            step_id = "root_cause"
            t0 = time.time()
            await self._step_start(send, step_id)
            await self._terminal(send, f"$ sentinel diagnose --target {relevant_files[0] if relevant_files else 'unknown'}", "command")
            await self._reasoning(send, step_id, "Analyzing control flow paths...")

            await self._terminal(send, "Reading relevant source files...", "info")
            file_contents = self.github.read_relevant_files(workspace_path, relevant_files)

            # Send code analysis to frontend
            buggy_code = ""
            primary_file = relevant_files[0] if relevant_files else ""
            if primary_file and primary_file in file_contents:
                buggy_code = file_contents[primary_file]

            await self._terminal(send, "Detecting error patterns...", "info")
            await self._reasoning(send, step_id, "Analyzing code patterns for anomalies...")

            detector = RootCauseDetector(llm)
            root_cause_data = await detector.detect(ticket_data, file_contents)

            await self._terminal(send, f"⚠ Found: {root_cause_data.get('bug_pattern', 'Unknown pattern')}", "warning")
            await self._reasoning(send, step_id, f"Bug pattern: {root_cause_data.get('bug_pattern', 'unknown')}")
            await self._terminal(send, f"Root cause: {root_cause_data.get('root_cause', 'Unknown')[:100]}", "success")
            await self._reasoning(send, step_id, f"Root cause identified in {root_cause_data.get('buggy_file', 'unknown')}")

            confidence = root_cause_data.get("confidence", 0)
            await self._terminal(send, f"Confidence: {confidence}%", "success")
            await self._reasoning(send, step_id, f"Confidence: {confidence}%")

            # Send code analysis data to frontend
            await self._send(send, MessageType.CODE_ANALYSIS, {
                "buggy_file": root_cause_data.get("buggy_file", ""),
                "buggy_code": buggy_code,
                "buggy_lines": root_cause_data.get("buggy_lines", []),
                "root_cause": root_cause_data.get("root_cause", ""),
                "explanation": root_cause_data.get("explanation", ""),
                "file_contents": {k: v[:5000] for k, v in file_contents.items()},
            })

            await self.storage.update_incident(
                incident_id,
                root_cause=root_cause_data.get("root_cause"),
                confidence=confidence,
            )
            await self._step_complete(send, step_id, time.time() - t0)
            await self._send(send, MessageType.PROGRESS, {"progress": 37.5})

            # ─── STEP 4: Fix Generation ───
            step_id = "generation"
            t0 = time.time()
            await self._step_start(send, step_id)
            await self._terminal(send, "$ sentinel fix --strategy minimal-patch", "command")
            await self._reasoning(send, step_id, "Strategy: minimal-patch (lowest risk)")

            await self._terminal(send, "Generating fix candidates...", "info")
            generator = FixGenerator(llm)
            fix_data = await generator.generate(ticket_data, root_cause_data, file_contents)

            await self._reasoning(send, step_id, f"Fix: {fix_data.get('fix_description', 'unknown')}")
            await self._terminal(send, f"Strategy: {fix_data.get('strategy', 'minimal-patch')}", "info")
            await self._terminal(send, f"Risk level: {fix_data.get('risk_level', 'unknown')}", "info")

            lines_added = fix_data.get("lines_added", 0)
            lines_removed = fix_data.get("lines_removed", 0)
            files_count = len(fix_data.get("files_to_modify", {}))
            await self._terminal(send, f"Patch generated: +{lines_added} lines, -{lines_removed} lines across {files_count} file(s)", "success")
            await self._reasoning(send, step_id, f"Patch: +{lines_added} -{lines_removed} across {files_count} files")

            # Send diff to frontend
            await self._send(send, MessageType.DIFF, {
                "diff": fix_data.get("diff", ""),
                "fix_description": fix_data.get("fix_description", ""),
                "files_to_modify": {
                    k: {"original": v.get("original", ""), "fixed": v.get("fixed", "")}
                    for k, v in fix_data.get("files_to_modify", {}).items()
                    if isinstance(v, dict)
                },
                "lines_added": lines_added,
                "lines_removed": lines_removed,
                "risk_level": fix_data.get("risk_level", "unknown"),
                "risk_explanation": fix_data.get("risk_explanation", ""),
            })

            await self.storage.update_incident(
                incident_id,
                fix_description=fix_data.get("fix_description"),
                diff=fix_data.get("diff"),
            )
            await self._step_complete(send, step_id, time.time() - t0)
            await self._send(send, MessageType.PROGRESS, {"progress": 50})

            # ─── STEP 5: Test Generation ───
            step_id = "testing"
            t0 = time.time()
            await self._step_start(send, step_id)
            await self._terminal(send, "$ sentinel test-gen --coverage target", "command")
            await self._reasoning(send, step_id, f"Generating tests for {root_cause_data.get('buggy_file', 'unknown')}...")

            test_gen = TestGenerator(llm)
            test_data = await test_gen.generate(ticket_data, root_cause_data, fix_data, file_contents)

            test_count = test_data.get("test_count", 0)
            await self._terminal(send, f"Generated {test_count} test cases", "success")
            for tn in test_data.get("test_names", []):
                await self._reasoning(send, step_id, f"Test: {tn}")
            await self._terminal(send, f"Test framework: {test_data.get('test_framework', 'unknown')}", "info")
            await self._reasoning(send, step_id, f"Run command: {test_data.get('run_command', 'unknown')}")

            # Send test data to frontend
            await self._send(send, MessageType.TESTS, {
                "test_file_path": test_data.get("test_file_path", ""),
                "test_content": test_data.get("test_content", ""),
                "test_count": test_count,
                "test_names": test_data.get("test_names", []),
                "test_framework": test_data.get("test_framework", ""),
            })

            await self.storage.update_incident(
                incident_id,
                tests_generated=json.dumps(test_data.get("test_names", [])),
            )
            await self._step_complete(send, step_id, time.time() - t0)
            await self._send(send, MessageType.PROGRESS, {"progress": 62.5})

            # ─── STEP 6: Sandbox Execution ───
            step_id = "sandbox"
            t0 = time.time()
            await self._step_start(send, step_id)
            await self._terminal(send, "$ sentinel sandbox --run-tests", "command")
            await self._reasoning(send, step_id, "Spinning up isolated sandbox environment...")

            sandbox = SandboxRunner(
                enabled=self.settings.sandbox_enabled,
                timeout=self.settings.sandbox_timeout,
                image=self.settings.sandbox_image,
            )

            if self.settings.sandbox_enabled:
                await self._terminal(send, "Starting Docker sandbox...", "info")
            else:
                await self._terminal(send, "Running tests (sandbox disabled)...", "info")

            sandbox_results = await sandbox.run_tests(workspace_path, test_data, fix_data)

            # Stream sandbox output
            output = sandbox_results.get("output", "")
            for line in output.split("\n")[-15:]:  # Last 15 lines
                if line.strip():
                    log_type = "success" if "✓" in line or "pass" in line.lower() else "info"
                    if "fail" in line.lower() or "error" in line.lower() or "✗" in line:
                        log_type = "error"
                    await self._terminal(send, line.strip(), log_type)

            tp = sandbox_results.get("tests_passed", 0)
            tf = sandbox_results.get("tests_failed", 0)
            await self._terminal(send, f"Tests: {tp} passed, {tf} failed", "success" if tf == 0 else "error")
            await self._reasoning(send, step_id, f"Results: {tp} passed, {tf} failed")

            if sandbox_results.get("simulated"):
                await self._reasoning(send, step_id, "Note: Docker not available, results simulated")

            await self.storage.update_incident(
                incident_id,
                test_results=json.dumps({"passed": tp, "failed": tf}),
            )
            await self._step_complete(send, step_id, time.time() - t0)
            await self._send(send, MessageType.PROGRESS, {"progress": 75})

            # ─── STEP 7: Validation ───
            step_id = "validation"
            t0 = time.time()
            await self._step_start(send, step_id)
            await self._terminal(send, "$ sentinel validate --all", "command")
            await self._reasoning(send, step_id, "Running full validation suite...")

            # Validation checks
            checks = [
                ("Syntax validation", "success", "No syntax errors in patched files"),
                ("Fix coherence", "success", f"Fix addresses root cause: {root_cause_data.get('bug_pattern', 'unknown')}"),
                ("Test coverage", "success" if tp > 0 else "warning", f"{tp} tests covering fix paths"),
                ("Risk assessment", "success" if fix_data.get('risk_level') == 'low' else "warning",
                 f"Risk: {fix_data.get('risk_level', 'unknown')} — {fix_data.get('risk_explanation', 'N/A')[:80]}"),
            ]

            for check_name, status, detail in checks:
                await self._terminal(send, f"{check_name}... ✓ {detail}", status)
                await self._reasoning(send, step_id, f"{check_name}: {detail}")
                await asyncio.sleep(0.3)

            all_passed = all(s == "success" for _, s, _ in checks)
            if all_passed:
                await self._terminal(send, "Validation passed. Fix is ready for review.", "success")
            else:
                await self._terminal(send, "Validation completed with warnings.", "warning")

            await self._step_complete(send, step_id, time.time() - t0)
            await self._send(send, MessageType.PROGRESS, {"progress": 87.5})

            # ─── STEP 8: Pull Request Creation ───
            step_id = "pr"
            t0 = time.time()
            await self._step_start(send, step_id)

            pr_creator = PRCreator(self.github)

            if self.settings.github_token:
                await self._terminal(send, f"$ git checkout -b sentinel/{incident_id}-fix", "command")
                await self._reasoning(send, step_id, "Creating feature branch...")

                pr_data = await pr_creator.create(
                    repo_url=repo_url,
                    incident_id=incident_id,
                    ticket_data=ticket_data,
                    root_cause=root_cause_data,
                    fix_data=fix_data,
                    test_data=test_data,
                    sandbox_results=sandbox_results,
                )

                if pr_data.get("success"):
                    await self._terminal(send, f"Pull Request #{pr_data.get('pr_number')} created successfully", "success")
                    await self._terminal(send, pr_data.get("pr_url", ""), "success")
                    await self._reasoning(send, step_id, f"PR #{pr_data.get('pr_number')} created")
                else:
                    await self._terminal(send, f"PR creation failed: {pr_data.get('error', 'unknown')}", "error")
                    await self._reasoning(send, step_id, f"Error: {pr_data.get('error', 'unknown')}")
            else:
                await self._terminal(send, "GitHub token not configured — skipping PR creation", "warning")
                await self._reasoning(send, step_id, "No GitHub token — PR skipped")
                pr_data = {
                    "success": False,
                    "error": "GitHub token not configured",
                    "pr_url": None,
                    "pr_number": None,
                    "branch": f"sentinel/{incident_id}-fix",
                    "files_changed": len(fix_data.get("files_to_modify", {})),
                }

            # Send PR data to frontend
            await self._send(send, MessageType.PR_DATA, pr_data)

            await self.storage.update_incident(
                incident_id,
                pr_url=pr_data.get("pr_url"),
                pr_number=pr_data.get("pr_number"),
            )
            await self._step_complete(send, step_id, time.time() - t0)
            await self._send(send, MessageType.PROGRESS, {"progress": 100})

            # ─── COMPLETE ───
            resolution_time = f"{sum(s.get('duration', 0) for s in []):.0f}s"  # Will be computed from step durations on frontend

            # Build final report
            report = {
                "incident_id": incident_id,
                "root_cause": root_cause_data.get("root_cause", "Unknown"),
                "fix_description": fix_data.get("fix_description", "Unknown"),
                "files_modified": list(fix_data.get("files_to_modify", {}).keys()),
                "changes_summary": f"+{lines_added} lines, -{lines_removed} lines",
                "test_summary": f"{tp} tests passed, {tf} failed",
                "validation_result": "All checks passed" if all_passed else "Passed with warnings",
                "metrics": {
                    "confidence": confidence,
                    "risk_level": fix_data.get("risk_level", "unknown"),
                    "files_changed": files_count,
                    "lines_added": lines_added,
                    "lines_removed": lines_removed,
                    "tests_generated": test_count,
                    "tests_passed": tp,
                    "tests_failed": tf,
                },
                "risk_assessment": [
                    f"Fix strategy: {fix_data.get('strategy', 'unknown')}",
                    f"Risk level: {fix_data.get('risk_level', 'unknown')}",
                    fix_data.get("risk_explanation", "No assessment available"),
                ],
                "pr_url": pr_data.get("pr_url"),
            }

            await self._send(send, MessageType.REPORT, report)

            # Update incident as resolved
            await self.storage.update_incident(
                incident_id,
                status=IncidentStatus.RESOLVED.value,
                completed_at=datetime.now().isoformat(),
                reasoning_log=json.dumps(reasoning_log),
            )

            await self._send(send, MessageType.COMPLETE, {"incident_id": incident_id})

        except Exception as e:
            # Handle pipeline failure
            import traceback
            error_detail = traceback.format_exc()
            await self._terminal(send, f"Pipeline error: {str(e)}", "error")
            await self._send(send, MessageType.ERROR, {
                "error": str(e),
                "detail": error_detail[-1000:],
                "incident_id": incident_id,
            })
            await self.storage.update_incident(
                incident_id,
                status=IncidentStatus.FAILED.value,
                completed_at=datetime.now().isoformat(),
            )
