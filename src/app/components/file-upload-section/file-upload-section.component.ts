import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FileData } from '../../artifacts/models/artifact';

@Component({
  selector: 'app-file-upload-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './file-upload-section.component.html',
  styleUrls: ['./file-upload-section.component.css']
})
export class FileUploadSectionComponent {
  @Input() isProcessing = false;
  @Input() selectedFilesData: FileData[] = [];
  @Input() processingMessage = '';
  @Input() footprintPreview: string | null = null;
  @Input() uploadError = false;
  @Input() errorMessage = '';
  @Input() isDragging = false;
  @Input() hintText?: string;

  @Output() selectFolder = new EventEmitter<void>();
  @Output() selectFile = new EventEmitter<void>();
  @Output() resetUpload = new EventEmitter<void>();
  @Output() fileDragOver = new EventEmitter<DragEvent>();
  @Output() fileDragLeave = new EventEmitter<DragEvent>();
  @Output() fileDrop = new EventEmitter<DragEvent>();

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  formatFileName(name: string): string {
    if (!name) return '';
    const lastSlash = name.lastIndexOf('/');
    return lastSlash === -1 ? name : name.substring(lastSlash + 1);
  }
}


