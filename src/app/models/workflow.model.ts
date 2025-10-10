export interface WorkflowArtifact {
  name: string;
  description: string;
  link?: string;
}

export interface GitHubRepository {
  title: string;
  description: string;
  gitHash: string;
  contents: RepositoryContent[];
}

export interface RepositoryContent {
  filename: string;
  hash: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  recentUpdates: string;
  lastUpdated: Date;
  contributor?: string;
  oscData?: WorkflowArtifact[];
  githubRepositories?: GitHubRepository[];
}
