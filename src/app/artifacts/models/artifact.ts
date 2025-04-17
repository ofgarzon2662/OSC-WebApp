/**
 * Data Transfer Object for creating a new artifact
 * Matches the backend expectations for artifact creation
 */
export interface CreateArtifactDTO {
    // Form fields
    title: string;              // Length: 3-200
    description: string;        // Length: 50-3000
    keywords?: string[];        // Optional array of strings
    links?: string[];          // Optional array of URLs
    dois?: string[];           // Optional array of DOI strings
    fundingAgencies?: string[]; // Optional array of agency names
    acknowledgements?: string;  // Optional, Length: 0-3000

    // File processing fields
    fileName: string;           // Length: 1-1000
    hash: string;              // SHA-256 hash of the file
}

/**
 * Internal interface for handling file data before submission
 * This is used internally in the component before creating the DTO
 */
export interface FileData {
    content: File;
    name: string;
    hash: string;
    size: number;
}
