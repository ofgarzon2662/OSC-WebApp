import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateArtifactDTO, FileData } from '../models/artifact';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ArtifactService {
    private apiUrl = `${environment.apiUrl}/artifacts`;

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

        // Add each field individually to the FormData
        formData.append('title', dto.title);
        formData.append('description', dto.description);
        formData.append('fileName', dto.fileName);
        formData.append('hash', dto.hash);
        
        // For arrays, añadimos cada elemento como "field[]"
        if (dto.keywords && dto.keywords.length > 0) {
            dto.keywords.forEach((keyword, index) => {
                formData.append(`keywords[${index}]`, keyword);
            });
        }
        
        if (dto.links && dto.links.length > 0) {
            dto.links.forEach((link, index) => {
                formData.append(`links[${index}]`, link);
            });
        }
        
        if (dto.dois && dto.dois.length > 0) {
            dto.dois.forEach((doi, index) => {
                formData.append(`dois[${index}]`, doi);
            });
        }
        
        if (dto.fundingAgencies && dto.fundingAgencies.length > 0) {
            dto.fundingAgencies.forEach((agency, index) => {
                formData.append(`fundingAgencies[${index}]`, agency);
            });
        }
        
        // Add acknowledgements if present
        if (dto.acknowledgements) {
            formData.append('acknowledgements', dto.acknowledgements);
        }

        // Debug logs
        console.log('=== DEBUG: Sending artifact DTO ===');
        console.log('DTO Object:', dto);
        console.log('File:', {
            name: fileData.name,
            size: fileData.size,
            type: fileData.content.type,
            lastModified: new Date(fileData.content.lastModified)
        });
        console.log('FormData entries:');
        // FormData is not easily inspectable, so we iterate through entries
        for (const pair of (formData as any).entries()) {
            console.log(`${pair[0]}: ${pair[0] === 'file' ? 'FILE CONTENT' : pair[1]}`);
        }
        console.log('=== END DEBUG ===');

        return this.http.post<void>(this.apiUrl, formData)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Creates a new artifact (alternative method using JSON API approach)
     * @param dto The artifact data
     * @param fileData The file data to upload
     * @returns Observable of the creation status
     */
    createArtifactJson(dto: CreateArtifactDTO, fileData: FileData): Observable<void> {
        // En este enfoque, estamos enviando el archivo como un archivo adjunto separado
        // y los datos como JSON en el cuerpo de la solicitud
        
        // Crear un objeto que contenga tanto los datos del artifact como información del archivo
        const payload = {
            ...dto,
            fileSize: fileData.size
        };
        
        // Debug logs
        console.log('=== DEBUG: Sending artifact JSON ===');
        console.log('Payload:', payload);
        console.log('=== END DEBUG ===');
        
        // Primera petición: enviar los datos del artifact
        return this.http.post<void>(`${this.apiUrl}/metadata`, payload)
            .pipe(
                // Si la primera petición es exitosa, enviamos el archivo
                switchMap(response => {
                    // Crear FormData solo para el archivo
                    const fileFormData = new FormData();
                    fileFormData.append('file', fileData.content, fileData.name);
                    
                    // Segunda petición: enviar el archivo
                    return this.http.post<void>(`${this.apiUrl}/upload`, fileFormData);
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Creates a new artifact using Postman-like approach
     * @param dto The artifact data
     * @param fileData The file data to upload
     * @returns Observable of the creation status
     */
    createArtifactHybrid(dto: CreateArtifactDTO, fileData: FileData): Observable<void> {
        // Crear FormData
        const formData = new FormData();
        
        // Añadir los campos individuales como JSON en formato string
        formData.append('title', dto.title);
        formData.append('description', dto.description);
        formData.append('fileName', dto.fileName);
        formData.append('hash', dto.hash);
        
        // Para arrays, añadimos el JSON string del array completo
        formData.append('keywords', JSON.stringify(dto.keywords || [""]));
        formData.append('links', JSON.stringify(dto.links || [""]));
        formData.append('dois', JSON.stringify(dto.dois || [""]));
        formData.append('fundingAgencies', JSON.stringify(dto.fundingAgencies || [""]));
        
        // Acknowledgements
        formData.append('acknowledgements', dto.acknowledgements || "");
        
        // Añadir el archivo al final
        formData.append('file', fileData.content, fileData.name);
        
        // Debug logs
        console.log('=== DEBUG: Sending Postman-like artifact ===');
        console.log('Artifact Data:', dto);
        console.log('FormData entries:');
        for (const pair of (formData as any).entries()) {
            console.log(`${pair[0]}: ${pair[0] === 'file' ? 'FILE CONTENT' : pair[1]}`);
        }
        console.log('=== END DEBUG ===');
        
        // Enviar la solicitud
        return this.http.post<void>(this.apiUrl, formData)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Creates a new artifact exactly as Postman would
     * @param dto The artifact data
     * @param fileData The file data to upload
     * @returns Observable of the creation status
     */
    createArtifactPostman(dto: CreateArtifactDTO, fileData: FileData): Observable<void> {
        // Crear FormData
        const formData = new FormData();
        
        // Crear un objeto que coincida exactamente con lo que envía Postman
        const postmanPayload = {
            title: dto.title,
            description: dto.description,
            fileName: dto.fileName,
            hash: dto.hash,
            keywords: dto.keywords || [""],
            links: dto.links || [""],
            dois: dto.dois || [""],
            fundingAgencies: dto.fundingAgencies || [""],
            acknowledgements: dto.acknowledgements || ""
        };
        
        // Convertir a string y añadir como 'data'
        formData.append('data', JSON.stringify(postmanPayload));
        
        // Añadir el archivo
        formData.append('file', fileData.content, fileData.name);
        
        // Debug logs
        console.log('=== DEBUG: Sending exact Postman payload ===');
        console.log('Postman Data:', postmanPayload);
        console.log('FormData entries:');
        for (const pair of (formData as any).entries()) {
            console.log(`${pair[0]}: ${pair[0] === 'file' ? 'FILE CONTENT' : pair[1]}`);
        }
        console.log('=== END DEBUG ===');
        
        // Configurar headers especiales
        const headers = {
            // No incluir Content-Type, el navegador lo configurará automáticamente con boundary
        };
        
        // Enviar la solicitud
        return this.http.post<void>(this.apiUrl, formData)
            .pipe(
                catchError(this.handleError)
            );
    }

    /**
     * Creates a new artifact by sending only metadata (no file upload)
     * @param dto The artifact data including hash and filename
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
        console.log('Metadata - fileName:', dto.fileName);
        console.log('Metadata - hash:', dto.hash);
        
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