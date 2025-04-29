import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import * as CryptoJS from 'crypto-js';
import JSZip from 'jszip';
import { ArtifactService } from '../services/artifact.service';
import { CreateArtifactDTO, FileData } from '../models/artifact';
import { ToastrService } from 'ngx-toastr';

// Size limits
const MAX_SINGLE_FILE_SIZE = 20 * 1024 * 1024;  // 20MB for single files
const MAX_FOLDER_SIZE = 15 * 1024 * 1024;       // 15MB for folders
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
    private fb: FormBuilder,
    private router: Router,
    private location: Location,
    private artifactService: ArtifactService,
    private toastr: ToastrService
  ) {
    this.artifactForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(3000)]],
      keywords: ['', [Validators.maxLength(1000), this.validateCommaSeparated()]],
      links: ['', [Validators.maxLength(2000), this.validateLinks()]],
      dois: ['', [this.validateDoi()]],
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
      
      // Verificar que cada URL tenga el protocolo correcto
      const invalidUrls = urls.some((url: string) => {
        // Si no tiene protocolo, es inválida
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return true;
        }
        
        // Validar el formato general de la URL
        const urlPattern = /^(https?:\/\/)[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
        return !urlPattern.test(url);
      });
      
      return invalidUrls ? { invalidLinks: true } : null;
    };
  }

  // Validador personalizado para DOIs
  private validateDoi() {
    return (control: any) => {
      if (!control.value) {
        return null; // Campo vacío es válido
      }

      const doiPattern = /^10.\d{4,9}\/[-._;()\/:A-Z0-9]+$/i;
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
      this.showError('Error processing file');
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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
  }

  onSubmit(): void {
    this.isSubmitting = true;
    if (this.artifactForm.valid && this.selectedFile && this.fileHash && !this.isProcessing) {
      const formValues = this.artifactForm.value;
      
      // Debug - log form values
      console.log('=== DEBUG: Form Values ===');
      console.log('Raw form values:', formValues);
      console.log('=== END DEBUG ===');
      
      // Extract arrays from comma-separated strings
      let keywords: string[] = [];
      if (formValues.keywords) {
        keywords = formValues.keywords
          .split(',')
          .map((k: string) => k.trim())
          .filter((k: string) => k !== '');
      }
      
      // Si keywords está vacío, enviamos [""] en lugar de []
      if (keywords.length === 0) {
        keywords = [""];
      }
      
      let links: string[] = [];
      if (formValues.links) {
        links = formValues.links
          .split(',')
          .map((l: string) => l.trim())
          .filter((l: string) => l !== '')
          .map((l: string) => {
            // Añadir automáticamente https:// si no tiene protocolo
            if (!l.startsWith('http://') && !l.startsWith('https://')) {
              return `https://${l}`;
            }
            return l;
          });
      }
      
      // Si links está vacío, enviamos [""] en lugar de []
      if (links.length === 0) {
        links = [""];
      }
      
      let dois: string[] = [];
      if (formValues.dois) {
        dois = formValues.dois
          .split(',')
          .map((d: string) => d.trim())
          .filter((d: string) => d !== '');
      }
      
      // Si dois está vacío, enviamos [""] en lugar de []
      if (dois.length === 0) {
        dois = [""];
      }
      
      let fundingAgencies: string[] = [];
      if (formValues.nsf) fundingAgencies.push('NSF');
      if (formValues.nih) fundingAgencies.push('NIH');
      if (formValues.noaa) fundingAgencies.push('NOAA');
      if (formValues.nasa) fundingAgencies.push('NASA');
      
      if (formValues.otherAgency) {
        const otherAgencies = formValues.otherAgency
          .split(',')
          .map((a: string) => a.trim())
          .filter((a: string) => a !== '');
        fundingAgencies.push(...otherAgencies);
      }
      
      // Si fundingAgencies está vacío, enviamos [""] en lugar de []
      if (fundingAgencies.length === 0) {
        fundingAgencies = [""];
      }
      
      // Debug - log processed arrays
      console.log('=== DEBUG: Processed Form Data ===');
      console.log('Keywords:', keywords);
      console.log('Links:', links);
      console.log('DOIs:', dois);
      console.log('Funding Agencies:', fundingAgencies);
      console.log('=== END DEBUG ===');
      
      // Create final DTO
      const artifactDto: CreateArtifactDTO = {
        title: formValues.title,
        description: formValues.description,
        keywords,
        links,
        dois,
        fundingAgencies,
        acknowledgements: formValues.acknowledgment || '', // Asegurarse de que nunca sea undefined o null
        fileName: this.selectedFile.name,
        hash: this.fileHash
      };
      
      // Debug - log final DTO
      console.log('=== DEBUG: Final DTO ===');
      console.log('Final DTO object:', artifactDto);
      console.log('=== END DEBUG ===');
      
      // Show processing state
      this.isProcessing = true;
      
      // Submit to backend using metadata-only approach (no file upload)
      this.artifactService.createArtifactMetadataOnly(artifactDto)
        .subscribe({
          next: () => {
            // Mostrar mensaje de éxito
            this.toastr.success('Your artifact has been successfully submitted!', 'Success!');
            
            // Marcar como enviado (para deshabilitar el botón)
            this.isSubmitted = true;
            
            // Resetear el formulario para una nueva entrada
            this.resetForm();
            
            // Finalizar el estado de procesamiento
            this.isProcessing = false;
          },
          error: (error) => {
            // Handle error
            this.showError(`Error creating artifact: ${error.message}`);
            this.isProcessing = false;
          },
          complete: () => {
            this.isProcessing = false;
          }
        });
    } else {
      console.log('Form invalid', this.artifactForm);
      this.isSubmitting = false;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 