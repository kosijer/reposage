import { google } from "@ai-sdk/google";
import { streamText, type CoreMessage } from "ai";
import { reposageTools } from "@/lib/ai/tools";
import type { RepoContext } from "@/lib/repo/types";

export const maxDuration = 30;

function buildSystemPrompt(repoContext: RepoContext | null): string {
  const base = `You are RepoSage, an AI assistant that helps users understand GitHub repositories.
Answer questions about the repository's purpose, setup, architecture, and code.
Be concise and practical. Use the provided tools when relevant.`;

  if (!repoContext) {
    return `${base}

No repository is currently loaded. If the user asks about a repo, suggest they paste a GitHub URL first to load it.`;
  }

  const { owner, name, readme, fileTree, keyFiles } = repoContext;
  const keyFilesBlock =
    keyFiles.length > 0
      ? keyFiles
          .map(
            (f) => `### ${f.name}\n\`\`\`\n${f.content.slice(0, 2000)}${f.content.length > 2000 ? "\n... truncated" : ""}\n\`\`\``
          )
          .join("\n\n")
      : "(none)";

  return `${base}

## Current repository: ${owner}/${name}

### README
${readme || "(no README)"}

### File tree (root)
${fileTree.join("\n")}

### Key config files
${keyFilesBlock}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, repoContext }: { messages: CoreMessage[]; repoContext?: RepoContext | null } = body;

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
}
