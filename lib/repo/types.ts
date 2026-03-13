/**
 * Types for indexed GitHub repository context.
 */

export interface KeyFile {
  name: string;
  content: string;
}

export interface RepoMetadata {
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  htmlUrl: string;
}

export interface RepoCommitSummary {
  sha: string;
  message: string;
  authorName: string | null;
  date: string;
  url: string;
}

export interface IndexedRepo {
  owner: string;
  name: string;
  readme: string;
  fileTree: string[];
  keyFiles: KeyFile[];
  metadata?: RepoMetadata;
  recentCommits?: RepoCommitSummary[];
}

export type RepoContext = IndexedRepo;

