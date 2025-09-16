export interface ArtifactHistoryItemValue {
  acknowledgements: string | null;
  dois: string[];
  footprint: string | null;
  fundingAgencies: string[];
  id: string;
  keywords: string[];
  lastTimeVerified: string | null;
  links: string[];
  manifest: Array<{
    algorithm: string;
    filename: string;
    hash: string;
  }>;
  submitterEmail: string;
  submitterUsername: string;
  submissionState: string;
  submittedAt: string | null;
  title: string;
  description: string;
  verified: boolean;
}

export interface ArtifactHistoryItem {
  txId: string;
  timestamp: string; // ISO date
  isDelete: boolean;
  value: ArtifactHistoryItemValue | null;
}

export interface ArtifactHistoryResponse {
  artifactId: string;
  items: ArtifactHistoryItem[];
  total: number;
  offset: number;
  limit: number;
  order: 'asc' | 'desc';
  hasMore: boolean;
}


