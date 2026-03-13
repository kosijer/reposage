import { NextResponse } from "next/server";
import type {
  IndexedRepo,
  KeyFile,
  RepoCommitSummary,
  RepoMetadata,
} from "@/lib/repo/types";

const OTHER_DOCS_MAX_FILES = 3;
const OTHER_DOCS_MAX_CHARS_PER_FILE = 4000;
const OTHER_DOCS_MAX_TOTAL_CHARS = 12000;
import { ERROR_MESSAGES } from "@/lib/constants/messages";

const GITHUB_API = "https://api.github.com";
const GITHUB_HEADERS = { Accept: "application/vnd.github.v3+json" };
const README_MAX_CHARS = 8000;
const KEY_CONFIG_FILES = [
  "package.json",
  "Cargo.toml",
  "pyproject.toml",
  "go.mod",
  "requirements.txt",
  "Gemfile",
  "docker-compose.yml",
  "Makefile",
  ".env.example",
];

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim();
  // Match: https://github.com/owner/repo, github.com/owner/repo, https://github.com/owner/repo/
  const match = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\/|\.git)?$/
  );
  if (!match) return null;
  const [, owner, repo] = match;
  if (!owner || !repo) return null;
  return { owner, repo };
}

interface GhContentItem {
  name: string;
  type: "file" | "dir";
  content?: string;
  encoding?: string;
}

interface GhRepo {
  description?: string | null;
  language?: string | null;
  topics?: string[];
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  default_branch?: string;
  license?: { spdx_id?: string | null; name?: string | null } | null;
  created_at?: string;
  updated_at?: string;
  pushed_at?: string;
  html_url?: string;
}

interface GhCommit {
  sha: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
  author?: {
    login?: string;
  } | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: ERROR_MESSAGES.missingUrl },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.invalidGitHubUrl },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Check repo exists and is public
    const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: GITHUB_HEADERS,
    });
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.repoNotFound },
          { status: 404 }
        );
      }
      if (repoRes.status === 403) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.rateLimited },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: ERROR_MESSAGES.fetchRepoFailed },
        { status: repoRes.status }
      );
    }

    const repoJson = (await repoRes.json()) as GhRepo;

    const metadata: RepoMetadata = {
      description: repoJson.description ?? null,
      language: repoJson.language ?? null,
      topics: Array.isArray(repoJson.topics) ? repoJson.topics : [],
      stars: repoJson.stargazers_count ?? 0,
      forks: repoJson.forks_count ?? 0,
      openIssues: repoJson.open_issues_count ?? 0,
      defaultBranch: repoJson.default_branch ?? "main",
      license:
        repoJson.license?.spdx_id ??
        repoJson.license?.name ??
        null,
      createdAt: repoJson.created_at ?? "",
      updatedAt: repoJson.updated_at ?? "",
      pushedAt: repoJson.pushed_at ?? "",
      htmlUrl: repoJson.html_url ?? "",
    };

    // Fetch README
    let readme = "";
    const readmeRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/readme`,
      { headers: GITHUB_HEADERS }
    );
    if (readmeRes.ok) {
      const readmeData = (await readmeRes.json()) as {
        content?: string;
        encoding?: string;
      };
      if (readmeData.content && readmeData.encoding === "base64") {
        readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
        if (readme.length > README_MAX_CHARS) {
          readme = readme.slice(0, README_MAX_CHARS) + "\n\n[... truncated]";
        }
      }
    }

    // Fetch root file tree
    const contentsRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents`,
      { headers: GITHUB_HEADERS }
    );
    const fileTree: string[] = [];
    if (contentsRes.ok) {
      const contents = (await contentsRes.json()) as GhContentItem[];
      for (const item of contents) {
        fileTree.push(item.type === "dir" ? `${item.name}/` : item.name);
      }
    }

    // Fetch key config files
    const keyFiles: KeyFile[] = [];
    const rootNames = new Set(fileTree.map((n) => n.replace(/\/$/, "")));
    for (const name of KEY_CONFIG_FILES) {
      if (!rootNames.has(name)) continue;
      const fileRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/${name}`,
        { headers: GITHUB_HEADERS }
      );
      if (!fileRes.ok) continue;
      const fileData = (await fileRes.json()) as {
        content?: string;
        encoding?: string;
      };
      if (fileData.content && fileData.encoding === "base64") {
        const content = Buffer.from(fileData.content, "base64").toString(
          "utf-8"
        );
        keyFiles.push({ name, content });
      }
    }

    // Fetch shallow commit history (most recent 3 commits)
    const recentCommits: RepoCommitSummary[] = [];
    let firstCommit: RepoCommitSummary | null = null;
    try {
      const commitsRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=3`,
        { headers: GITHUB_HEADERS }
      );
      if (commitsRes.ok) {
        const commitsJson = (await commitsRes.json()) as GhCommit[];
        for (const c of commitsJson) {
          recentCommits.push({
            sha: c.sha,
            message: (c.commit?.message ?? "").split("\n")[0],
            authorName:
              c.commit?.author?.name ??
              c.author?.login ??
              null,
            date: c.commit?.author?.date ?? "",
            url: c.html_url ?? "",
          });
        }
        // First commit: get last page from Link header (same per_page so page number is correct)
        const linkHeader = commitsRes.headers.get("Link");
        const lastPageMatch = linkHeader?.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="last"/);
        if (lastPageMatch) {
          const lastPage = parseInt(lastPageMatch[1], 10);
          const firstRes = await fetch(
            `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=3&page=${lastPage}`,
            { headers: GITHUB_HEADERS }
          );
          if (firstRes.ok) {
            const firstJson = (await firstRes.json()) as GhCommit[];
            // Last page: commits are still newest-first, so the oldest is last in the array
            const c = firstJson[firstJson.length - 1];
            if (c) {
              firstCommit = {
                sha: c.sha,
                message: (c.commit?.message ?? "").split("\n")[0],
                authorName:
                  c.commit?.author?.name ?? c.author?.login ?? null,
                date: c.commit?.author?.date ?? "",
                url: c.html_url ?? "",
              };
            }
          }
        }
      }
    } catch (commitErr) {
      console.error("[repo/index] commits fetch failed", commitErr);
    }

    // Other .md docs: root (except README) and docs/ if present, token-capped
    const otherDocs: KeyFile[] = [];
    const rootMdFiles = fileTree.filter(
      (n) => n.endsWith(".md") && n !== "README.md"
    );
    let docsMdFiles: string[] = [];
    if (fileTree.some((n) => n === "docs/")) {
      try {
        const docsRes = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/contents/docs`,
          { headers: GITHUB_HEADERS }
        );
        if (docsRes.ok) {
          const docsContents = (await docsRes.json()) as GhContentItem[];
          docsMdFiles = docsContents
            .filter((i) => i.type === "file" && i.name.endsWith(".md"))
            .map((i) => `docs/${i.name}`);
        }
      } catch {
        // ignore
      }
    }
    const allMdCandidates = [...rootMdFiles, ...docsMdFiles].slice(
      0,
      OTHER_DOCS_MAX_FILES
    );
    let totalOtherChars = 0;
    for (const path of allMdCandidates) {
      if (totalOtherChars >= OTHER_DOCS_MAX_TOTAL_CHARS) break;
      const fileRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
        { headers: GITHUB_HEADERS }
      );
      if (!fileRes.ok) continue;
      const fileData = (await fileRes.json()) as {
        content?: string;
        encoding?: string;
      };
      if (fileData.content && fileData.encoding === "base64") {
        const content = Buffer.from(fileData.content, "base64").toString(
          "utf-8"
        );
        const capped = content.slice(0, OTHER_DOCS_MAX_CHARS_PER_FILE);
        const truncated = content.length > OTHER_DOCS_MAX_CHARS_PER_FILE;
        otherDocs.push({
          name: path,
          content: capped + (truncated ? "\n\n[... truncated]" : ""),
        });
        totalOtherChars += capped.length;
      }
    }

    const indexed: IndexedRepo = {
      owner,
      name: repo,
      readme,
      fileTree,
      keyFiles,
      metadata,
      recentCommits,
      firstCommit: firstCommit ?? undefined,
      otherDocs: otherDocs.length > 0 ? otherDocs : undefined,
    };

    return NextResponse.json(indexed);
  } catch (err) {
    console.error("[repo/index]", err);
    return NextResponse.json(
      { error: "Failed to index repository" },
      { status: 500 }
    );
  }
}
