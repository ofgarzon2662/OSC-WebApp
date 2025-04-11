import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import * as CryptoJS from 'crypto-js';
import JSZip from 'jszip';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes
const MAX_FILES_COUNT = 1000; // Límite razonable de archivos

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

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('folderInput') folderInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private location: Location
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

      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      const urls = control.value.split(',').map((url: string) => url.trim());
      
      const invalidUrls = urls.some((url: string) => !urlPattern.test(url));
      
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

    if (file.size > MAX_FILE_SIZE) {
      this.showError('File size exceeds 500MB limit');
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

    if (files.length > MAX_FILES_COUNT) {
      this.showError(`Folder contains too many files (${files.length}). Maximum allowed is ${MAX_FILES_COUNT} files.`);
      return;
    }

    // Calculate total size before processing
    let totalSize = 0;
    for (const file of Array.from(files)) {
      totalSize += file.size;
      if (totalSize > MAX_FILE_SIZE) {
        this.showError(`Total folder size (${this.formatFileSize(totalSize)}) exceeds the limit of ${this.formatFileSize(MAX_FILE_SIZE)}`);
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

      // Create ZIP after hash calculation
      const zip = new JSZip();
      for (const file of fileContents) {
        zip.file(file.path, file.content);
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      });

      this.selectedFile = new File([zipBlob], `${folderName}.zip`);
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

  onSubmit(): void {
    if (this.artifactForm.valid && this.selectedFile && !this.isProcessing) {
      console.log('Form submitted:', {
        ...this.artifactForm.value,
        file: this.selectedFile,
        hash: this.fileHash
      });
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