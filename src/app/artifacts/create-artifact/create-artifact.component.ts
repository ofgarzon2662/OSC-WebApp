import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as CryptoJS from 'crypto-js';
import { ArtifactService } from '../services/artifact.service';
import { CreateArtifactDTO, FileData, ManifestItem } from '../models/artifact';
import { ToastrService } from 'ngx-toastr';

// Size limits
export const MAX_SINGLE_FILE_SIZE = 20 * 1024 * 1024;   // 20 MB
export const MAX_FOLDER_SIZE      = 20 * 1024 * 1024;   // 20 MB
export const MAX_FILES_IN_FOLDER  = 50;                 // max files in a folder

@Component({
  selector: 'app-create-artifact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-artifact.component.html',
  styleUrls: ['./create-artifact.component.css']
})
export class CreateArtifactComponent implements OnInit {
  artifactForm: FormGroup;
  isDragging = false;
  isProcessing = false;
  uploadError = false;
  errorMessage = '';
  selectedFilesData: FileData[] = [];
  isSubmitted = false;
  isSubmitting = false;
  processingMessage = '';

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('folderInput') folderInput!: ElementRef;

  constructor(
    private readonly fb: FormBuilder,
    private readonly location: Location,
    private readonly artifactService: ArtifactService,
    private readonly toastr: ToastrService
  ) {
    this.artifactForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(3000)]],
      keywords: ['', [Validators.maxLength(1000), this.validateCommaSeparated()]],
      links: ['', [Validators.maxLength(2000), this.validateLinks()]],
      doi: ['', [this.validateDoi()]],
      nsf: [false],
      nih: [false],
      noaa: [false],
      nasa: [false],
      otherAgency: ['', [Validators.maxLength(100), this.validateCommaSeparated()]],
      acknowledgment: ['', [Validators.maxLength(3000)]]
    });
  }

  ngOnInit(): void {
    // Crear elementos input ocultos para selección de archivos y carpetas
    this.createHiddenInputs();
  }

  private createHiddenInputs(): void {
    // Input para archivos
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (event) => this.handleFileSelection(event));
    this.fileInput = new ElementRef(fileInput);
    document.body.appendChild(fileInput);

    // Input para carpetas
    const folderInput = document.createElement('input');
    folderInput.type = 'file';
    folderInput.setAttribute('webkitdirectory', '');
    folderInput.style.display = 'none';
    folderInput.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        this.handleFolderSelection(input.files);
      }
    });
    this.folderInput = new ElementRef(folderInput);
    document.body.appendChild(folderInput);
  }

  // Validador personalizado para valores separados por comas
  private validateCommaSeparated() {
    return (control: any) => {
      if (!control.value) {
        return null; // Campo vacío es válido
      }

      const values = control.value.split(',').map((item: string) => item.trim());
      const hasEmptyValues = values.some((item: string) => item === '');

      return hasEmptyValues ? { invalidFormat: true } : null;
    };
  }

  // Validador personalizado para URLs
  private validateLinks() {
    return (control: any) => {
      if (!control.value) {
        return null; // Campo vacío es válido
      }

      const urls = control.value.split(',').map((url: string) => url.trim());
      
      // Validar que no haya valores vacíos
      const hasEmptyValues = urls.some((url: string) => url === '');
      
      if (hasEmptyValues) {
        return { invalidLinks: true };
      }
      
      // URL validation regex pattern
      const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
      
      // Check if any URL is invalid
      const hasInvalidUrls = urls.some((url: string) => !urlPattern.test(url));
      
      return hasInvalidUrls ? { invalidLinks: true } : null;
    };
  }

  // Validador personalizado para DOIs
  private validateDoi() {
    return (control: any) => {
      if (!control.value) {
        return null; // Campo vacío es válido
      }

      const doiPattern = /^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
      const dois = control.value.split(',').map((doi: string) => doi.trim());
      
      const invalidDois = dois.some((doi: string) => !doiPattern.test(doi));
      
      return invalidDois ? { invalidDoi: true } : null;
    };
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (this.isProcessing) return;

    const items = event.dataTransfer?.items;
    if (!items) return;

    // Check if it's a file or a folder
    try {
      const entry = items[0].webkitGetAsEntry();
      if (entry?.isDirectory) {
        this.showError('Drag-and-drop for folders is not supported. Please use the "Select a Folder" button.');
        return;
      }

      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        // If multiple files are dragged, treat as a folder selection
        if (files.length > 1) {
            this.showError('You can only drag and drop a single file. For multiple files, please use the "Select a Folder" button.');
            return;
        }
        await this.handleSingleFileSelection(files[0]);
      }
    } catch (error) {
        this.showError('Could not process the dropped item. It might be a folder or an unsupported file type.');
    }
  }

  selectFile(): void {
    this.fileInput.nativeElement.click();
  }

  selectFolder(): void {
    this.folderInput.nativeElement.click();
  }

  async handleFileSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    // For folder selection, we'll get multiple files
    if (files.length > 1) {
      await this.handleFolderSelection(files);
    } else {
      await this.handleSingleFileSelection(files[0]);
    }
  }

  async handleSingleFileSelection(file: File) {
    if (file.size === 0) {
      this.showError('The selected file is empty. Please choose a file with content.');
      return;
    }

    if (file.size > MAX_SINGLE_FILE_SIZE) {
      this.showError(`File size (${this.formatFileSize(file.size)}) exceeds the limit of ${this.formatFileSize(MAX_SINGLE_FILE_SIZE)}.`);
      return;
    }

    this.isProcessing = true;
    this.processingMessage = 'Calculating file hash...';
    this.selectedFilesData = []; // Reset any previous selection
    
    try {
      const hash = await this.calculateFileHash(file);
      this.selectedFilesData.push({
        content: file,
        name: file.name,
        hash: hash,
        size: file.size
      });
      this.uploadError = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error processing file';
      this.showError(`Error processing file: ${errorMessage}`);
      console.error('File processing error:', error);
    } finally {
      this.isProcessing = false;
      this.processingMessage = '';
    }
  }

  async handleFolderSelection(files: FileList) {
    if (files.length === 0) {
      this.showError('The selected folder is empty. Please choose a folder with files.');
      return;
    }

    if (files.length > MAX_FILES_IN_FOLDER) {
      this.showError(`Folder contains too many files (${files.length}). Maximum allowed is ${MAX_FILES_IN_FOLDER} files.`);
      return;
    }

    // Calculate total size and check for empty files
    let totalSize = 0;
    let hasNonEmptyFiles = false;
    for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file) {
            totalSize += file.size;
            if (file.size > 0) hasNonEmptyFiles = true;
        }
    }

    if (totalSize > MAX_FOLDER_SIZE) {
      this.showError(`Total folder size (${this.formatFileSize(totalSize)}) exceeds the limit of ${this.formatFileSize(MAX_FOLDER_SIZE)}.`);
      return;
    }

    if (!hasNonEmptyFiles) {
      this.showError('All files in the selected folder are empty. Please choose a folder with content.');
      return;
    }

    this.isProcessing = true;
    this.uploadError = false;
    this.selectedFilesData = []; // Reset previous selection
    this.processingMessage = `Processing ${files.length} files...`;
    
    try {
      // Process each file to calculate its hash
      const filePromises = [];
      for (let i = 0; i < files.length; i++) {
          const file = files.item(i);
          if (file) {
              filePromises.push((async () => {
                  if (file.size === 0) return null; // Skip empty files

                  const hash = await this.calculateFileHash(file);
                  return {
                      content: file,
                      name: file.webkitRelativePath || file.name,
                      hash: hash,
                      size: file.size,
                  };
              })());
          }
      }

      const filesData = (await Promise.all(filePromises)).filter(Boolean) as FileData[];

      // Sort files by name for a consistent order
      filesData.sort((a, b) => a.name.localeCompare(b.name));
      
      this.selectedFilesData = filesData;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error processing folder';
        this.showError(`Error processing folder: ${errorMessage}`);
        console.error('Folder processing error:', error);
    } finally {
      this.isProcessing = false;
      this.processingMessage = '';
    }
  }

  private async calculateFileHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        const binary = event.target?.result;
        if (binary) {
          const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(binary as any)).toString();
          resolve(hash);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private showError(message: string): void {
    this.uploadError = true;
    this.errorMessage = message;
    this.selectedFilesData = [];
  }

  resetUpload(): void {
    this.selectedFilesData = [];
    this.uploadError = false;
    this.errorMessage = '';
    this.isProcessing = false;
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
    if (this.folderInput?.nativeElement) this.folderInput.nativeElement.value = '';
  }

  goBack(): void {
    this.location.back();
  }

  resetForm(): void {
    // Resetear el formulario
    this.artifactForm.reset();
    
    // Restablecer valores por defecto para checkboxes
    this.artifactForm.patchValue({
      nsf: false,
      nih: false,
      noaa: false,
      nasa: false
    });
    
    // Resetear el archivo
    this.resetUpload();
    
    // Resetear el estado de envío
    this.isSubmitted = false;
    this.isSubmitting = false;
  }

  /**
   * Process comma-separated string into a string array
   * @param value Comma-separated string
   * @param fieldName Optional field name to apply different processing rules
   * @returns Array of strings
   */
  private processCommaSeparatedField(value: string, fieldName?: string): string[] {
    if (!value) {
      // For links, return empty array instead of [""]
      if (fieldName === 'links') return [];
      return [""];
    }
    
    const items = value
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    
    // For links, return empty array instead of [""] when no valid items
    if (items.length === 0 && fieldName === 'links') return [];
    
    return items.length === 0 ? [""] : items;
  }

  /**
   * Process funding agencies from form values
   * @param formValues Form values containing agency checkboxes and other agency field
   * @returns Array of funding agency strings
   */
  private processFundingAgencies(formValues: any): string[] {
    const agencies: string[] = [];
    
    // Add selected checkbox agencies
    if (formValues.nsf) agencies.push('NSF');
    if (formValues.nih) agencies.push('NIH');
    if (formValues.noaa) agencies.push('NOAA');
    if (formValues.nasa) agencies.push('NASA');
    
    // Add other agencies if provided
    if (formValues.otherAgency) {
      const otherAgencies = this.processCommaSeparatedField(formValues.otherAgency);
      if (otherAgencies[0] !== "") {
        agencies.push(...otherAgencies);
      }
    }
    
    return agencies.length === 0 ? [""] : agencies;
  }

  /**
   * Create artifact DTO from form values and file data
   * @param formValues Raw form values
   * @returns Formatted CreateArtifactDTO object
   */
  private createArtifactDto(formValues: any): CreateArtifactDTO {
    // Process arrays from comma-separated strings
    const keywords = this.processCommaSeparatedField(formValues.keywords);
    const links = this.processCommaSeparatedField(formValues.links, 'links');
    const dois = this.processCommaSeparatedField(formValues.doi);
    const fundingAgencies = this.processFundingAgencies(formValues);
    
    // Log for debugging
    this.logProcessedData(keywords, links, dois, fundingAgencies);
    
    // Create the manifest from the selected files
    const manifest: ManifestItem[] = this.selectedFilesData.map(fileData => ({
        hash: fileData.hash,
        filename: this.formatFileName(fileData.name),
        algorithm: 'sha256'
    }));

    // Create and return the DTO
    return {
      title: formValues.title,
      description: formValues.description,
      keywords,
      links,
      dois,
      fundingAgencies,
      acknowledgements: formValues.acknowledgment ?? '', // Ensure it's never undefined or null
      manifest
    };
  }

  /**
   * Log processed form data for debugging
   */
  private logProcessedData(keywords: string[], links: string[], dois: string[], fundingAgencies: string[]): void {
    console.log('=== DEBUG: Processed Form Data ===');
    console.log('Keywords:', keywords);
    console.log('Links:', links);
    console.log('DOIs:', dois);
    console.log('Funding Agencies:', fundingAgencies);
    console.log('=== END DEBUG ===');
  }

  /**
   * Submit the artifact to the backend
   * @param artifactDto The prepared artifact data
   */
  private submitArtifact(artifactDto: CreateArtifactDTO): void {
    // Show processing state
    this.isProcessing = true;
    
    // Log for debugging
    console.log('=== DEBUG: Final DTO ===');
    console.log('Final DTO object:', artifactDto);
    console.log('=== END DEBUG ===');
    
    // Submit to backend using metadata-only approach
    this.artifactService.createArtifactMetadataOnly(artifactDto)
      .subscribe({
        next: () => this.handleSubmitSuccess(),
        error: (error) => this.handleSubmitError(error),
        complete: () => this.isProcessing = false
      });
  }

  /**
   * Handle successful artifact submission
   */
  private handleSubmitSuccess(): void {
    // Show success message
    this.toastr.success('Your artifact has been successfully submitted!', 'Success!');
    
    // Update form state
    this.isSubmitted = true;
    
    // Reset form for new entry
    this.resetForm();
    
    // End processing state
    this.isProcessing = false;
  }

  /**
   * Handle error during artifact submission
   * @param error The error object
   */
  private handleSubmitError(error: any): void {
    // Display error message
    this.showError(`Error creating artifact: ${error.message}`);
    this.isProcessing = false;
  }

  /**
   * Submit form data if valid
   */
  onSubmit(): void {
    this.isSubmitting = true;
    
    // Validate form and file data
    if (!this.isFormAndFileValid()) {
      console.log('Form invalid', this.artifactForm);
      this.isSubmitting = false;
      return;
    }
    
    // Process form data
    const formValues = this.artifactForm.value;
    
    // Debug - log raw form values
    console.log('=== DEBUG: Form Values ===');
    console.log('Raw form values:', formValues);
    console.log('=== END DEBUG ===');
    
    // Create DTO and submit
    const artifactDto = this.createArtifactDto(formValues);
    this.submitArtifact(artifactDto);
  }

  /**
   * Check if form and file data are valid for submission
   * @returns true if valid, false otherwise
   */
  isFormAndFileValid(): boolean {
    return this.artifactForm.valid && 
           this.selectedFilesData.length > 0 && 
           !this.isProcessing;
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  /**
   * Format the file name to remove the path.
   * @param name The full file name, possibly with a path.
   * @returns The file name without the path.
   */
  public formatFileName(name: string): string {
    if (!name) return '';
    const lastSlash = name.lastIndexOf('/');
    return lastSlash === -1 ? name : name.substring(lastSlash + 1);
  }
} 