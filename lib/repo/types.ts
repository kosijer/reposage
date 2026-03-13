/**
 * Types for indexed GitHub repository context.
 */

export interface KeyFile {
  name: string;
  content: string;
}

export interface IndexedRepo {
  owner: string;
  name: string;
  readme: string;
  fileTree: string[];
  keyFiles: KeyFile[];
}

export interface RepoContext {
  owner: string;
  name: string;
  readme: string;
  fileTree: string[];
  keyFiles: KeyFile[];
}
