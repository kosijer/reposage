import { NextResponse } from "next/server";
import type { IndexedRepo, KeyFile } from "@/lib/repo/types";

const GITHUB_API = "https://api.github.com";
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid url" },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Check repo exists and is public
    const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return NextResponse.json(
          { error: "Repo not found or not public" },
          { status: 404 }
        );
      }
      if (repoRes.status === 403) {
        return NextResponse.json(
          { error: "Rate limited. Try again later." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch repository" },
        { status: repoRes.status }
      );
    }

    // Fetch README
    let readme = "";
    const readmeRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/readme`,
      { headers: { Accept: "application/vnd.github.v3+json" } }
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
      { headers: { Accept: "application/vnd.github.v3+json" } }
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
        { headers: { Accept: "application/vnd.github.v3+json" } }
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

    const indexed: IndexedRepo = {
      owner,
      name: repo,
      readme,
      fileTree,
      keyFiles,
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
