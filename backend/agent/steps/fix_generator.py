"""
Step 4: Fix Generator — generate a minimal code fix based on root cause analysis.
"""

from langchain_core.messages import SystemMessage, HumanMessage


SYSTEM_PROMPT = """You are Sentinel's fix generator. Given the root cause analysis and buggy code, generate a minimal, correct fix.

Rules:
1. Make the SMALLEST change possible — no refactoring, no style changes
2. Only modify the exact lines needed to fix the bug
3. Preserve all existing functionality
4. Generate a unified diff format patch
5. Also provide the complete fixed file content

Respond ONLY with valid JSON:
{
    "fix_description": "One-line description of what the fix does",
    "strategy": "minimal-patch | refactor | config-change",
    "files_to_modify": {
        "path/to/file.ts": {
            "original": "exact original code block that needs changing",
            "fixed": "the fixed version of that code block",
            "full_content": "complete file content with fix applied"
        }
    },
    "diff": "unified diff format showing the changes",
    "lines_added": 8,
    "lines_removed": 2,
    "risk_level": "low | medium | high",
    "risk_explanation": "Why this fix is safe/risky"
}"""


class FixGenerator:
    """Generates minimal code fixes using LLM."""

    def __init__(self, llm):
        self.llm = llm

    async def generate(
        self,
        ticket_data: dict,
        root_cause: dict,
        file_contents: dict[str, str],
    ) -> dict:
        """Generate a fix for the identified root cause."""
        # Build context
        code_context = ""
        for path, content in file_contents.items():
            code_context += f"\n--- FILE: {path} ---\n{content}\n"

        prompt = f"""Incident: {ticket_data.get('summary', 'Unknown')}
Error Type: {ticket_data.get('error_type', 'Unknown')}

Root Cause Analysis:
- Root Cause: {root_cause.get('root_cause', 'Unknown')}
- Buggy File: {root_cause.get('buggy_file', 'Unknown')}
- Buggy Lines: {root_cause.get('buggy_lines', [])}
- Bug Pattern: {root_cause.get('bug_pattern', 'Unknown')}
- Explanation: {root_cause.get('explanation', 'N/A')}

Source Code:
{code_context}

Generate a minimal, correct fix for this bug. Output the fix as a unified diff and the full corrected file content."""

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]

        response = await self.llm.ainvoke(messages)
        content = response.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        import json
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {
                "fix_description": "Fix generation failed — LLM output not parseable",
                "strategy": "unknown",
                "files_to_modify": {},
                "diff": content,
                "lines_added": 0,
                "lines_removed": 0,
                "risk_level": "unknown",
                "risk_explanation": "Could not assess risk",
            }
