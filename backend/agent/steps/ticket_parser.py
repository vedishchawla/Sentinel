"""
Step 1: Ticket Parser — extract structured incident data from natural language.
"""

from langchain_core.messages import SystemMessage, HumanMessage


SYSTEM_PROMPT = """You are Sentinel's ticket parser. Your job is to extract structured incident information from raw ticket descriptions, error logs, or issue URLs.

Extract the following fields from the input:
1. error_type: The category of error (e.g., "Memory Leak", "Race Condition", "Null Reference", "SQL Injection", "Type Error", "Connection Error", etc.)
2. severity: P0 (critical/outage), P1 (high/degraded), P2 (medium), P3 (low)
3. affected_module: The specific module, service, or component affected (e.g., "auth/middleware", "billing/payment")
4. error_message: The actual error message or stack trace excerpt
5. summary: A one-line summary of the incident
6. keywords: Key technical terms to search for in the codebase (e.g., function names, error classes, file paths mentioned)

Respond ONLY with valid JSON in this exact format:
{
    "error_type": "...",
    "severity": "P0|P1|P2|P3",
    "affected_module": "...",
    "error_message": "...",
    "summary": "...",
    "keywords": ["keyword1", "keyword2", ...]
}"""


class TicketParser:
    """Parses incident tickets into structured data using LLM."""

    def __init__(self, llm):
        self.llm = llm

    async def parse(self, description: str) -> dict:
        """Parse a raw incident description into structured data."""
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Parse this incident ticket:\n\n{description}"),
        ]

        response = await self.llm.ainvoke(messages)
        content = response.content.strip()

        # Extract JSON from response (handle markdown code blocks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        import json
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Fallback: return raw extraction
            return {
                "error_type": "Unknown",
                "severity": "P2",
                "affected_module": "unknown",
                "error_message": description[:200],
                "summary": description[:100],
                "keywords": [],
            }
