import { google } from "@ai-sdk/google";
import { streamText, type CoreMessage } from "ai";
import { reposageTools } from "@/lib/ai/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const model = google("gemini-2.0-flash");

  const result = streamText({
    model,
    system: `You are RepoSage, an assistant for repository insights and graph exploration.
Use the provided tools when the user asks about repos or searching the graph.`,
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
