"""
Step 5: Test Generator — create test cases that verify the fix.
"""

from langchain_core.messages import SystemMessage, HumanMessage


SYSTEM_PROMPT = """You are Sentinel's test generator. Given the bug fix that was applied, generate test cases that:
1. Verify the fix actually resolves the bug
2. Test edge cases around the affected code
3. Ensure no regressions in related functionality

Generate tests appropriate for the project's language/framework. Detect the test framework from the project (e.g., Jest for JS/TS, pytest for Python, JUnit for Java).

Respond ONLY with valid JSON:
{
    "test_file_path": "path/to/__tests__/affected.test.ts",
    "test_content": "full test file content as a string",
    "test_framework": "jest | pytest | junit | mocha | etc",
    "test_count": 4,
    "test_names": [
        "should fix the original bug",
        "should handle edge case X",
        "should not regress on Y",
        "should handle error case Z"
    ],
    "run_command": "npm test -- --filter affected"
}"""


class TestGenerator:
    """Generates test cases for the applied fix."""

    def __init__(self, llm):
        self.llm = llm

    async def generate(
        self,
        ticket_data: dict,
        root_cause: dict,
        fix_data: dict,
        file_contents: dict[str, str],
    ) -> dict:
        """Generate tests that verify the fix."""
        prompt = f"""Incident: {ticket_data.get('summary', 'Unknown')}
Error Type: {ticket_data.get('error_type', 'Unknown')}

Root Cause: {root_cause.get('root_cause', 'Unknown')}
Buggy File: {root_cause.get('buggy_file', 'Unknown')}
Bug Pattern: {root_cause.get('bug_pattern', 'Unknown')}

Fix Applied: {fix_data.get('fix_description', 'Unknown')}
Fix Diff:
{fix_data.get('diff', 'N/A')}

Project files present: {', '.join(file_contents.keys())}

Generate comprehensive test cases that verify this fix works correctly and catches regressions."""

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
                "test_file_path": "tests/test_fix.py",
                "test_content": f"# Auto-generated test\n# Fix: {fix_data.get('fix_description', 'unknown')}\n# Test generation failed - manual review needed",
                "test_framework": "unknown",
                "test_count": 0,
                "test_names": [],
                "run_command": "echo 'No tests generated'",
            }
