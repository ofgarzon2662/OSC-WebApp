export interface Artifact {
    id: string;
    title: string;
    description: string;
    submittedAt: string;
    verified: boolean;
    lastTimeVerified: string | null;
    lastTimeUpdated: string | null;
}
