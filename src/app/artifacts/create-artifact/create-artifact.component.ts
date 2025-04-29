import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as CryptoJS from 'crypto-js';
import { ArtifactService } from '../services/artifact.service';
import { CreateArtifactDTO } from '../models/artifact';
import { ToastrService } from 'ngx-toastr';

// Size limits
const MAX_SINGLE_FILE_SIZE = 20 * 1024 * 1024;  // 20MB for single files
const MAX_FOLDER_SIZE = 20 * 1024 * 1024;       // 20MB for folders
const MAX_FILES_IN_FOLDER = 50;                 // Maximum files in a folder

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
  selectedFile: File | null = null;
  fileHash = '';
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
      
      return hasEmptyValues ? { invalidLinks: true } : null;
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

    const items = event.dataTransfer?.items;
    if (!items) return;

    // Verificar si es un archivo o carpeta
    const entry = items[0].webkitGetAsEntry();
    if (entry?.isDirectory) {
      this.showError('Please use the "Select a Folder" button to upload folders');
      return;
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.handleSingleFileSelection(files[0]);
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
    this.selectedFile = file;
    
    try {
      const hash = await this.calculateFileHash(file);
      this.fileHash = hash;
      this.uploadError = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error processing file';
      this.showError(`Error processing file: ${errorMessage}`);
      console.error('File processing error:', error);
    } finally {
      this.isProcessing = false;
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

    // Calculate total size before processing
    let totalSize = 0;
    for (const file of Array.from(files)) {
      totalSize += file.size;
      if (totalSize > MAX_FOLDER_SIZE) {
        this.showError(`Total folder size (${this.formatFileSize(totalSize)}) exceeds the limit of ${this.formatFileSize(MAX_FOLDER_SIZE)}.`);
        return;
      }
    }

    if (totalSize === 0) {
      this.showError('All files in the selected folder are empty. Please choose a folder with content.');
      return;
    }

    // Set processing state after validations
    this.isProcessing = true;
    this.uploadError = false;
    
    try {
      const fileContents: { path: string; content: ArrayBuffer }[] = [];

      // Read all files
      for (const file of Array.from(files)) {
        const content = await file.arrayBuffer();
        fileContents.push({
          path: file.webkitRelativePath,
          content
        });
      }

      // Sort files by path for consistent order
      fileContents.sort((a, b) => a.path.localeCompare(b.path));

      // Create a single buffer with all file contents in a consistent order
      const concatenatedContents = new Uint8Array(totalSize);
      let offset = 0;

      for (const file of fileContents) {
        const content = new Uint8Array(file.content);
        concatenatedContents.set(content, offset);
        offset += content.length;
      }

      // Calculate hash from the concatenated contents
      const hash = CryptoJS.SHA256(
        CryptoJS.lib.WordArray.create(concatenatedContents)
      ).toString();

      // Get folder name from the first file's path
      const folderName = fileContents[0].path.split('/')[0];

      // Store the folder name as the selected file
      this.selectedFile = new File([concatenatedContents], folderName);
      this.fileHash = hash;
      this.uploadError = false;
    } catch (error) {
      if (error instanceof Error) {
        this.showError(error.message);
      } else {
        this.showError('Error processing folder');
      }
    } finally {
      this.isProcessing = false;
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
    this.selectedFile = null;
    this.fileHash = '';
  }

  resetUpload(): void {
    this.selectedFile = null;
    this.fileHash = '';
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
   * @returns Array of strings
   */
  private processCommaSeparatedField(value: string): string[] {
    if (!value) return [""];
    
    const items = value
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    
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
    const links = this.processCommaSeparatedField(formValues.links);
    const dois = this.processCommaSeparatedField(formValues.doi);
    const fundingAgencies = this.processFundingAgencies(formValues);
    
    // Log for debugging
    this.logProcessedData(keywords, links, dois, fundingAgencies);
    
    // Create and return the DTO
    return {
      title: formValues.title,
      description: formValues.description,
      keywords,
      links,
      dois,
      fundingAgencies,
      acknowledgements: formValues.acknowledgment ?? '', // Ensure it's never undefined or null
      fileName: this.selectedFile!.name,
      hash: this.fileHash
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
  private isFormAndFileValid(): boolean {
    return this.artifactForm.valid && 
           !!this.selectedFile && 
           !!this.fileHash && 
           !this.isProcessing;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 