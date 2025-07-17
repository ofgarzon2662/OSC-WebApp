import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { CreateArtifactDTO } from '../models/artifact';
import { environment } from '../../../environments/environment';
import { Artifact } from '../../models/artifact.model';
import { ArtifactDetail } from '../../models/artifact-detail.model';

@Injectable({
    providedIn: 'root'
})
export class ArtifactService {
    private apiUrl = `${environment.apiUrl}/artifacts`;
    private artifactsCache$: Observable<Artifact[]> | undefined;

    constructor(private http: HttpClient) { }

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
     * Creates a new artifact by sending only metadata (no file upload)
     * @param dto The artifact data including the manifest of files
     * @returns Observable of the creation status
     */
    createArtifactMetadataOnly(dto: CreateArtifactDTO): Observable<void> {
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
        return this.http.post<void>(this.apiUrl, dto)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Handles HTTP errors
     * @param error The error response
     * @returns An observable with a user-facing error message
     */
    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An error occurred while processing your request.';
        
        // Debug log for errors
        console.error('=== DEBUG: API Error ===');
        console.error('Status:', error.status);
        console.error('Error object:', error);
        
        // Mostrar el objeto de error completo
        if (error.error) {
            console.error('Error body:', error.error);
            
            // Mostrar mensajes específicos si existen
            if (error.error.message && Array.isArray(error.error.message)) {
                console.error('Validation errors:');
                error.error.message.forEach((msg: string, index: number) => {
                    console.error(`[${index + 1}] ${msg}`);
                });
                
                // Usar el primer mensaje de validación como mensaje de error
                if (error.error.message.length > 0) {
                    errorMessage = error.error.message[0];
                }
            }
        }
        
        console.error('=== END ERROR DEBUG ===');
        
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = error.error.message;
        } else {
            // Server-side error
            switch (error.status) {
                case 400:
                    if (!errorMessage.includes('Invalid')) {
                        errorMessage = 'Invalid artifact data provided.';
                    }
                    break;
                case 401:
                    errorMessage = 'You must be authenticated to create artifacts.';
                    break;
                case 412:
                    errorMessage = 'An artifact with this title already exists in the organization.';
                    break;
                case 413:
                    errorMessage = 'The file size exceeds the maximum allowed limit.';
                    break;
                case 415:
                    errorMessage = 'The file type is not supported.';
                    break;
                case 500:
                    errorMessage = 'A server error occurred. Please try again later.';
                    break;
            }
        }

        return throwError(() => new Error(errorMessage));
    }
} 