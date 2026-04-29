"""
Step 3: Root Cause Detection — analyze relevant code to identify the bug.
"""

from langchain_core.messages import SystemMessage, HumanMessage


SYSTEM_PROMPT = """You are Sentinel's root cause detector. Given the incident context and relevant source code files, identify the exact root cause of the bug.

Your analysis should:
1. Examine each relevant file for the specific bug described in the incident
2. Identify the exact line(s) and code pattern causing the issue
3. Explain the bug mechanism (why this code is broken)
4. Rate your confidence in the diagnosis

Respond ONLY with valid JSON:
{
    "root_cause": "Detailed description of the root cause",
    "buggy_file": "path/to/buggy/file.ts",
    "buggy_lines": [42, 43, 44],
    "bug_pattern": "Name of the bug pattern (e.g., 'missing cleanup', 'race condition', 'null dereference')",
    "explanation": "Step-by-step explanation of how the bug manifests",
    "confidence": 85.5,
    "secondary_files": ["other/affected/file.ts"]
}"""


class RootCauseDetector:
    """LLM-powered root cause analysis on actual source code."""

    def __init__(self, llm):
        self.llm = llm

    async def detect(
        self,
        ticket_data: dict,
        file_contents: dict[str, str],
    ) -> dict:
        """Analyze source code to find the root cause of the incident."""
        # Build code context
        code_context = ""
        for path, content in file_contents.items():
            code_context += f"\n--- FILE: {path} ---\n{content}\n"

        prompt = f"""Incident Summary: {ticket_data.get('summary', 'Unknown')}
Error Type: {ticket_data.get('error_type', 'Unknown')}
Affected Module: {ticket_data.get('affected_module', 'Unknown')}
Error Message: {ticket_data.get('error_message', 'N/A')}

Source Code:
{code_context}

Analyze the code and identify the root cause of this incident."""

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
                "root_cause": "Could not determine root cause (LLM parsing failed)",
                "buggy_file": list(file_contents.keys())[0] if file_contents else "unknown",
                "buggy_lines": [],
                "bug_pattern": "unknown",
                "explanation": content,
                "confidence": 30.0,
                "secondary_files": [],
            }
