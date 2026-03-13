import { google } from "@ai-sdk/google";
import { streamText, type CoreMessage } from "ai";
import { reposageTools } from "@/lib/ai/tools";
import type { RepoContext } from "@/lib/repo/types";
import { ERROR_MESSAGES, PROMPTS } from "@/lib/constants/messages";

export const maxDuration = 30;

function buildSystemPrompt(repoContext: RepoContext | null): string {
  const base = PROMPTS.systemBase;

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
  try {
    const body = await req.json();
    const { messages, repoContext }: { messages?: CoreMessage[]; repoContext?: RepoContext | null } = body ?? {};

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.chatBadRequest }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
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
      JSON.stringify({ error: "Unexpected error while handling chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
