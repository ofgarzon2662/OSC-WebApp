export interface ArtifactDetail {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  links: string[];
  dois: string[];
  fundingAgencies: string[];
  acknowledgements: string;
  manifest: Array<{
    hash: string;
    filename: string;
    algorithm: string;
  }>;
  verified: boolean;
  lastTimeVerified: string | null;
  submissionState: string;
  submitterEmail: string;
  submitterUsername: string;
  submittedAt: string;
  blockchainTxId: string | null;
  peerId: string | null;
  submissionError: string | null;
  organization: {
    name: string;
  };
} 