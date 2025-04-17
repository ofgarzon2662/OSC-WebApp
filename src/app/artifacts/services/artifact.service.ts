import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateArtifactDTO, FileData } from '../models/artifact';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ArtifactService {
    private apiUrl = `${environment.apiUrl}/orgganizations/artifacts`;

    constructor(private http: HttpClient) {}

    /**
     * Creates a new artifact
     * @param dto The artifact data
     * @param fileData The file data to upload
     * @returns Observable of the creation status
     */
    createArtifact(dto: CreateArtifactDTO, fileData: FileData): Observable<void> {
        // Create FormData to handle file upload
        const formData = new FormData();

        // Add the file
        formData.append('file', fileData.content, fileData.name);

        // Add the artifact data as JSON string
        formData.append('data', JSON.stringify(dto));

        return this.http.post<void>(this.apiUrl, formData)
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
        
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = error.error.message;
        } else {
            // Server-side error
            switch (error.status) {
                case 400:
                    errorMessage = 'Invalid artifact data provided.';
                    break;
                case 401:
                    errorMessage = 'You must be authenticated to create artifacts.';
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