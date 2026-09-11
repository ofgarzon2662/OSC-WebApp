export interface RepositoryContent {
  filename: string;
  hash: string;
}

export interface GitHubRepository {
  url: string;
  description: string;
  gitHash: string;
  contents: RepositoryContent[];
}

export interface WorkflowArtifact {
  id: string;
  title: string;
  description: string;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  githubRepositories: GitHubRepository[];
  artifacts: WorkflowArtifact[];
  submissionState: string;
  submitterEmail: string;
  submitterUsername: string;
  submission_comment: string;
  submittedAt: Date;
  updatedAt: Date;
  blockchainTxId?: string;
  peerId?: string;
  submissionError?: string;
  organization?: { name: string };
}

export interface WorkflowListItem {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  submissionState: string;
  submittedAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowDTO {
  title: string;
  description: string;
  keywords: string[];
  githubRepositories: GitHubRepository[];
  artifactIds: string[];
  submission_comment: string;
}

export interface UpdateWorkflowDTO {
  keywords?: string[];
  githubRepositories?: GitHubRepository[];
  artifactIds?: string[];
  submission_comment: string;
}
