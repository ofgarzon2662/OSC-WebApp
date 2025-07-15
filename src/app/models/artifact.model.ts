export interface Artifact {
    id: string;
    title: string;
    description: string;
    keywords: string[];
    submittedAt: string;
    verified: boolean;
    lastTimeVerified: string | null;
    lastTimeUpdated: string | null;
}
