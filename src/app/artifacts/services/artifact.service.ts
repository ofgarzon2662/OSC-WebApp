import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { CreateArtifactDTO, UpdateArtifactDTO } from '../models/artifact';
import { environment } from '../../../environments/environment';
import { Artifact } from '../../models/artifact.model';
import { ArtifactDetail } from '../../models/artifact-detail.model';
import { ArtifactHistoryResponse } from '../../models/artifact-history.model';

@Injectable({
    providedIn: 'root'
})
export class ArtifactService {
    private readonly apiUrl = `${environment.apiUrl}/artifacts`;
    private artifactsCache$: Observable<Artifact[]> | undefined;

    constructor(private readonly http: HttpClient) { }

    /**
     * Gets all artifacts, with caching.
     */
    getArtifacts(): Observable<Artifact[]> {
        this.artifactsCache$ ??= this.http.get<Artifact[]>(this.apiUrl).pipe(
            shareReplay(1),
            catchError(this.handleError)
        );
        return this.artifactsCache$;
    }

    /**
     * Gets a single artifact by its ID
     */
    getArtifactById(id: string): Observable<ArtifactDetail> {
        return this.http.get<ArtifactDetail>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
    }

    /**
     * Gets blockchain-backed history for an artifact
     */
    getArtifactHistory(id: string, options?: {
        offset?: number;
        limit?: number;
        order?: 'asc' | 'desc';
        includeValue?: boolean;
    }): Observable<ArtifactHistoryResponse> {
        const { offset = 0, limit = 50, order = 'desc', includeValue = true } = options ?? {};
        const url = `${this.apiUrl}/${id}/history?offset=${offset}&limit=${limit}&order=${order}&includeValue=${includeValue}`;
        return this.http.get<ArtifactHistoryResponse>(url).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Triggers a backend refresh of artifact history
     */
    refreshArtifactHistory(id: string, options?: {
        offset?: number;
        limit?: number;
        order?: 'asc' | 'desc';
        includeValue?: boolean;
    }): Observable<any> {
        const { offset = 0, limit = 500, order = 'desc', includeValue = true } = options ?? {};
        const url = `${this.apiUrl}/${id}/history/refresh?offset=${offset}&limit=${limit}&order=${order}&includeValue=${includeValue}`;
        return this.http.post(url, {}).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Creates a new artifact by sending only metadata (no file upload)
     * @param dto The artifact data including the manifest of files
     * @returns Observable of the creation status
     */
    createArtifactMetadataOnly(dto: CreateArtifactDTO): Observable<{id: string}> {
        // Debug logs
        console.log('=== DEBUG: Sending metadata only ===');
        
        // Log each property separately to avoid truncation in console
        console.log('Metadata - title:', dto.title);
        console.log('Metadata - description:', dto.description);
        console.log('Metadata - keywords:', dto.keywords);
        console.log('Metadata - links:', dto.links);
        console.log('Metadata - dois:', dto.dois);
        console.log('Metadata - fundingAgencies:', dto.fundingAgencies);
        console.log('Metadata - acknowledgements:', dto.acknowledgements);
        console.log('Metadata - manifest:', dto.manifest);
        
        console.log('=== END DEBUG ===');
        
        // Simplemente enviamos el DTO como JSON, sin FormData ni archivos
        return this.http.post<{id: string}>(this.apiUrl, dto)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Updates an existing artifact by sending only metadata (no file upload)
     */
    updateArtifactMetadataOnly(id: string, dto: UpdateArtifactDTO): Observable<void> {
        console.log('=== DEBUG: Updating metadata only ===');
        console.log('ID:', id);
        console.log('Manifest length:', dto.manifest?.length);
        console.log('Footprint:', dto.footprint);
        console.log('=== END DEBUG ===');

        return this.http.put<void>(`${this.apiUrl}/${id}`, dto)
            .pipe(catchError(this.handleError));
    }

    /**
     * Handles HTTP errors
     * @param error The error response
     * @returns An observable with a user-facing error message
     */
    private handleError(error: HttpErrorResponse) {
        // 1) Debug always
        this.logErrorDebug(error);

        // 2) Prefer specific validation message when available
        const validationMsg = this.extractValidationMessage(error);
        if (validationMsg) {
            return throwError(() => new Error(validationMsg));
        }

        // 3) Client-side vs server-side
        if (error.error instanceof ErrorEvent) {
            return throwError(() => new Error(error.error.message));
        }

        // 4) Map status to message with a small helper
        const message = this.getServerErrorMessage(error.status);
        return throwError(() => new Error(message));
    }

    private logErrorDebug(error: HttpErrorResponse): void {
        console.error('=== DEBUG: API Error ===');
        console.error('Status:', error.status);
        console.error('Error object:', error);
        if (error.error) {
            console.error('Error body:', error.error);
        }
        console.error('=== END ERROR DEBUG ===');
    }

    private extractValidationMessage(error: HttpErrorResponse): string | null {
        const body = (error && (error as any).error) as any;
        const messages: unknown = body?.message;
        if (Array.isArray(messages) && messages.length > 0) {
            console.error('Validation errors:');
            messages.forEach((m: string, i: number) => console.error(`[${i + 1}] ${m}`));
            return messages[0];
        }
        return null;
    }

    private getServerErrorMessage(status: number): string {
        const map: Record<number, string> = {
            400: 'Invalid artifact data provided.',
            401: 'You must be authenticated to create artifacts.',
            412: 'An artifact with this title already exists in the organization.',
            413: 'The file size exceeds the maximum allowed limit.',
            415: 'The file type is not supported.',
            500: 'A server error occurred. Please try again later.'
        };
        return map[status] ?? 'An error occurred while processing your request.';
    }
} 