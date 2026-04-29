"""
Step 2: Codebase Analyzer — scan repo structure, find relevant files based on ticket context.
"""

from langchain_core.messages import SystemMessage, HumanMessage


SYSTEM_PROMPT = """You are Sentinel's codebase analyzer. Given a list of files in a repository and an incident description, identify the most relevant files that are likely related to the bug.

Consider:
- File paths that match the affected module/component
- Files whose names relate to the error keywords
- Configuration files that might be misconfigured
- Test files related to the affected code
- Entry points and routing files

Respond ONLY with valid JSON:
{
    "relevant_files": ["path/to/file1.ts", "path/to/file2.py", ...],
    "analysis": "Brief explanation of why these files are relevant",
    "dependency_chain": "module_a -> module_b -> module_c (the likely call chain)"
}

Return at most 10 most relevant files, ordered by relevance."""


class CodebaseAnalyzer:
    """Analyzes repository structure to find relevant files for an incident."""

    def __init__(self, llm):
        self.llm = llm

    async def analyze(
        self,
        file_list: list[str],
        ticket_data: dict,
        repo_url: str,
    ) -> dict:
        """Find relevant files in the codebase based on ticket context."""
        # Build a compact file listing (truncate if too many files)
        files_str = "\n".join(file_list[:500])
        if len(file_list) > 500:
            files_str += f"\n... and {len(file_list) - 500} more files"

        prompt = f"""Repository: {repo_url}
Total files: {len(file_list)}

Incident Summary: {ticket_data.get('summary', 'Unknown')}
Error Type: {ticket_data.get('error_type', 'Unknown')}
Affected Module: {ticket_data.get('affected_module', 'Unknown')}
Error Message: {ticket_data.get('error_message', 'N/A')}
Keywords: {', '.join(ticket_data.get('keywords', []))}

File listing:
{files_str}

Identify the most relevant files for this incident."""

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
            result = json.loads(content)
            # Filter to only files that actually exist
            existing_files = [f for f in result.get("relevant_files", []) if f in file_list]
            result["relevant_files"] = existing_files if existing_files else file_list[:5]
            return result
        except json.JSONDecodeError:
            # Fallback: use keyword matching
            keywords = ticket_data.get("keywords", [])
            matched = []
            for f in file_list:
                for kw in keywords:
                    if kw.lower() in f.lower():
                        matched.append(f)
                        break
            return {
                "relevant_files": matched[:10] if matched else file_list[:5],
                "analysis": "Matched files by keyword search (LLM parsing failed)",
                "dependency_chain": "unknown",
            }
