import { tool } from "ai";
import { z } from "zod";

/**
 * Example tools for Vercel AI SDK + Gemini tool calling.
 * Add your own tools and wire them in app/api/chat/route.ts.
 */
export const reposageTools = {
  // Example: get repo summary (implement with real data source later)
  getRepoSummary: tool({
    description: "Get a short summary of a repository by owner and name",
    parameters: z.object({
      owner: z.string().describe("GitHub org or user"),
      repo: z.string().describe("Repository name"),
    }),
    execute: async ({ owner, repo }) => {
      return {
        owner,
        repo,
        summary: `Summary for ${owner}/${repo} (implement with your data source).`,
      };
    },
  }),
};

export type RepoSageTools = typeof reposageTools;
