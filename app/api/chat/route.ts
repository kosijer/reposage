import { google } from "@ai-sdk/google";
import { streamText, type CoreMessage } from "ai";
import { reposageTools } from "@/lib/ai/tools";
import type { RepoContext } from "@/lib/repo/types";
import { ERROR_MESSAGES, PROMPTS } from "@/lib/constants/messages";

export const maxDuration = 30;
const README_MAX_FOR_PROMPT = 8000;

function buildSystemPrompt(repoContext: RepoContext | null): string {
  const base = PROMPTS.systemBase;

  if (!repoContext) {
    return `${base}

No repository is currently loaded. If the user asks about a repo, suggest they paste a GitHub URL first to load it.`;
  }

  const {
    owner,
    name,
    readme,
    fileTree,
    keyFiles,
    metadata,
    recentCommits,
  } = repoContext;

  const metaBlock = metadata
    ? [
        metadata.description ? `Description: ${metadata.description}` : null,
        metadata.language ? `Language: ${metadata.language}` : null,
        `Stars: ${metadata.stars} · Forks: ${metadata.forks} · Open issues: ${metadata.openIssues}`,
        metadata.topics?.length ? `Topics: ${metadata.topics.join(", ")}` : null,
        `Created: ${metadata.createdAt} · Last pushed: ${metadata.pushedAt}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "(no metadata)";

  const commitsBlock =
    recentCommits && recentCommits.length > 0
      ? recentCommits
          .map(
            (c) =>
              `- ${c.date} — ${c.message} (${c.authorName ?? "unknown"})`,
          )
          .join("\n")
      : "(no recent commits fetched)";

  const keyFilesBlock =
    keyFiles.length > 0
      ? keyFiles
          .map(
            (f) =>
              `### ${f.name}\n\`\`\`\n${f.content.slice(0, 2000)}${
                f.content.length > 2000 ? "\n... truncated" : ""
              }\n\`\`\``,
          )
          .join("\n\n")
      : "(none)";

  const readmeTruncated = readme.endsWith("[... truncated]");
  const readmeNote = readmeTruncated
    ? `(NOTE: README truncated to ${README_MAX_FOR_PROMPT} characters)\n\n`
    : "";

  const dirs = fileTree.filter((n) => n.endsWith("/"));
  const files = fileTree.filter((n) => !n.endsWith("/"));
  const interestingFiles = files.filter((name) =>
    [
      "package.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "requirements.txt",
      "pyproject.toml",
      "go.mod",
      "docker-compose.yml",
      "README.md",
      "Makefile",
    ].includes(name),
  );

  const fileTreeBlock = [
    dirs.length ? `Directories:\n${dirs.join("\n")}` : null,
    interestingFiles.length
      ? `\nKey files:\n${interestingFiles.join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `${base}

You are currently answering about repository: ${owner}/${name}.
Do not refer to other repositories or previous tabs unless the user explicitly asks you to switch context.

## Current repository: ${owner}/${name}

### Repo metadata
${metaBlock}

### Recent commits (most recent first)
${commitsBlock}

### README
${readmeNote}${readme || "(no README)"}

### File tree (root)
${fileTreeBlock || "(no root entries)"}

### Key config files
${keyFilesBlock}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      repoContext,
    }: { messages?: CoreMessage[]; repoContext?: RepoContext | null } =
      body ?? {};

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.chatBadRequest }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const model = google("gemini-2.0-flash");
    const systemPrompt = buildSystemPrompt(repoContext ?? null);

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools: reposageTools,
      maxSteps: 5,
      onFinish: async () => {
        // Optional: log or persist to Supabase
        // const supabase = await createClient();
        // await supabase.from('chat_logs').insert({ ... });
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[chat]", err);
    return new Response(
      JSON.stringify({
        error: "Unexpected error while handling chat request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
