"""
GitHub Service — handles repo cloning, file reading, branch creation, and PR submission.
"""

import os
import shutil
import tempfile
from typing import Optional
from pathlib import Path

import httpx
from github import Github, GithubException


class GitHubService:
    """Wrapper around GitHub API + local git operations."""

    def __init__(self, token: Optional[str] = None, work_dir: str = "/tmp/sentinel-workspaces"):
        self.token = token
        self.work_dir = work_dir
        os.makedirs(work_dir, exist_ok=True)

        if token:
            self.github = Github(token)
        else:
            self.github = None

    def _parse_repo_url(self, url: str) -> tuple[str, str]:
        """Extract owner/repo from a GitHub URL or owner/repo string."""
        url = url.strip().rstrip("/")
        # Handle full URLs
        if "github.com" in url:
            parts = url.split("github.com/")[-1].split("/")
            owner = parts[0]
            repo = parts[1].replace(".git", "") if len(parts) > 1 else ""
            return owner, repo
        # Handle owner/repo format
        if "/" in url:
            parts = url.split("/")
            return parts[0], parts[1]
        raise ValueError(f"Cannot parse repository from: {url}")

    async def clone_repo(self, repo_url: str) -> str:
        """Clone a repository to a local workspace directory. Returns the path."""
        owner, repo_name = self._parse_repo_url(repo_url)
        workspace_path = os.path.join(self.work_dir, f"{owner}_{repo_name}")

        # Clean up existing workspace
        if os.path.exists(workspace_path):
            shutil.rmtree(workspace_path)

        # Clone via httpx (download zip for speed, no git dependency needed)
        zip_url = f"https://api.github.com/repos/{owner}/{repo_name}/zipball/main"
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        headers["Accept"] = "application/vnd.github+json"

        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            # Try main branch first, then master
            response = await client.get(zip_url, headers=headers)
            if response.status_code == 404:
                zip_url = zip_url.replace("/main", "/master")
                response = await client.get(zip_url, headers=headers)

            if response.status_code != 200:
                raise RuntimeError(
                    f"Failed to download repo {owner}/{repo_name}: {response.status_code} {response.text[:200]}"
                )

        # Extract zip
        import zipfile
        import io
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            # The zip contains a top-level directory like "owner-repo-sha/"
            top_dirs = set()
            for name in zf.namelist():
                top_dirs.add(name.split("/")[0])

            zf.extractall(self.work_dir)

        # Rename the extracted directory
        if top_dirs:
            extracted_dir = os.path.join(self.work_dir, list(top_dirs)[0])
            if os.path.exists(extracted_dir):
                os.rename(extracted_dir, workspace_path)

        return workspace_path

    def get_file_tree(self, workspace_path: str, max_depth: int = 4) -> list[dict]:
        """Build a file tree structure from the workspace."""
        def _build_tree(path: str, depth: int = 0) -> list[dict]:
            if depth >= max_depth:
                return []

            result = []
            try:
                entries = sorted(os.listdir(path))
            except PermissionError:
                return []

            # Skip common non-relevant directories
            skip_dirs = {
                "node_modules", ".git", "__pycache__", ".venv", "venv",
                ".next", "dist", "build", ".idea", ".vscode", ".cache",
                "coverage", ".nyc_output", ".pytest_cache"
            }

            for entry in entries:
                full_path = os.path.join(path, entry)
                rel_path = os.path.relpath(full_path, workspace_path)

                if entry.startswith(".") and entry not in (".env", ".env.example", ".gitignore"):
                    continue

                if os.path.isdir(full_path):
                    if entry in skip_dirs:
                        continue
                    children = _build_tree(full_path, depth + 1)
                    result.append({
                        "name": entry,
                        "type": "folder",
                        "path": rel_path,
                        "children": children,
                    })
                else:
                    result.append({
                        "name": entry,
                        "type": "file",
                        "path": rel_path,
                    })

            return result

        return _build_tree(workspace_path)

    def read_file(self, workspace_path: str, file_path: str) -> str:
        """Read a file from the workspace."""
        full_path = os.path.join(workspace_path, file_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # Only read text files
        try:
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except Exception as e:
            return f"[Could not read file: {e}]"

    def read_relevant_files(self, workspace_path: str, file_paths: list[str]) -> dict[str, str]:
        """Read multiple files and return a map of path -> content."""
        result = {}
        for fp in file_paths:
            try:
                content = self.read_file(workspace_path, fp)
                # Limit file size to avoid token overflow
                if len(content) > 15000:
                    content = content[:15000] + "\n\n... [truncated]"
                result[fp] = content
            except Exception:
                result[fp] = "[Could not read file]"
        return result

    def list_all_files(self, workspace_path: str) -> list[str]:
        """List all file paths in the workspace (for search/analysis)."""
        files = []
        skip_dirs = {
            "node_modules", ".git", "__pycache__", ".venv", "venv",
            ".next", "dist", "build", ".cache", "coverage"
        }
        for root, dirs, filenames in os.walk(workspace_path):
            dirs[:] = [d for d in dirs if d not in skip_dirs and not d.startswith(".")]
            for f in filenames:
                if f.startswith("."):
                    continue
                rel = os.path.relpath(os.path.join(root, f), workspace_path)
                files.append(rel)
        return files

    async def create_branch_and_pr(
        self,
        repo_url: str,
        branch_name: str,
        title: str,
        body: str,
        files_to_update: dict[str, str],
        base_branch: str = "main",
    ) -> dict:
        """Create a branch with changes and open a PR. Returns PR metadata."""
        if not self.github:
            return {
                "success": False,
                "error": "GitHub token not configured",
                "pr_url": None,
                "pr_number": None,
            }

        owner, repo_name = self._parse_repo_url(repo_url)

        try:
            repo = self.github.get_repo(f"{owner}/{repo_name}")

            # Get the base branch ref
            try:
                base_ref = repo.get_branch(base_branch)
            except GithubException:
                base_ref = repo.get_branch("master")
                base_branch = "master"

            base_sha = base_ref.commit.sha

            # Create new branch
            repo.create_git_ref(
                ref=f"refs/heads/{branch_name}",
                sha=base_sha
            )

            # Commit files
            for file_path, content in files_to_update.items():
                try:
                    existing = repo.get_contents(file_path, ref=branch_name)
                    repo.update_file(
                        file_path,
                        f"fix: {title}",
                        content,
                        existing.sha,
                        branch=branch_name
                    )
                except GithubException:
                    repo.create_file(
                        file_path,
                        f"fix: {title}",
                        content,
                        branch=branch_name
                    )

            # Create PR
            pr = repo.create_pull(
                title=title,
                body=body,
                head=branch_name,
                base=base_branch,
            )

            return {
                "success": True,
                "pr_url": pr.html_url,
                "pr_number": pr.number,
                "branch": branch_name,
                "base": base_branch,
                "files_changed": len(files_to_update),
            }

        except GithubException as e:
            return {
                "success": False,
                "error": str(e),
                "pr_url": None,
                "pr_number": None,
            }

    async def fetch_issue(self, repo_url: str, issue_number: int) -> dict:
        """Fetch issue details from GitHub."""
        if not self.github:
            return {"error": "GitHub token not configured"}

        owner, repo_name = self._parse_repo_url(repo_url)
        try:
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            issue = repo.get_issue(issue_number)
            return {
                "title": issue.title,
                "body": issue.body or "",
                "labels": [l.name for l in issue.labels],
                "state": issue.state,
                "number": issue.number,
            }
        except GithubException as e:
            return {"error": str(e)}
