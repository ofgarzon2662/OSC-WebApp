import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateArtifactComponent } from './create-artifact.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ArtifactService } from '../services/artifact.service';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';

// Add Jasmine types
declare const jasmine: any;

describe('CreateArtifactComponent', () => {
  let component: CreateArtifactComponent;
  let fixture: ComponentFixture<CreateArtifactComponent>;
  let router: Router;
  let location: Location;

  // Mock dependencies
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const locationSpy = jasmine.createSpyObj('Location', ['back']);
  const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);
  const artifactServiceSpy = jasmine.createSpyObj('ArtifactService', ['createArtifactMetadataOnly']);
  
  // Set up the artifact service mock to return a successful response
  artifactServiceSpy.createArtifactMetadataOnly.and.returnValue(of({}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        CommonModule,
        CreateArtifactComponent
      ],
      providers: [
        FormBuilder,
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy },
        { provide: ToastrService, useValue: toastrSpy },
        { provide: ArtifactService, useValue: artifactServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateArtifactComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Form Validation Tests
  describe('Form Validation', () => {
    it('should initialize with invalid form', () => {
      expect(component.artifactForm.valid).toBeFalsy();
    });

    it('should validate required fields', () => {
      const form = component.artifactForm;
      expect(form.get('title')?.errors?.['required']).toBeTruthy();
      expect(form.get('description')?.errors?.['required']).toBeTruthy();
    });

    it('should validate title length', () => {
      const titleControl = component.artifactForm.get('title');
      titleControl?.setValue('ab');
      expect(titleControl?.errors?.['minlength']).toBeTruthy();
      
      titleControl?.setValue('a'.repeat(201));
      expect(titleControl?.errors?.['maxlength']).toBeTruthy();
      
      titleControl?.setValue('Valid Title');
      expect(titleControl?.errors).toBeNull();
    });

    it('should validate description length', () => {
      const descControl = component.artifactForm.get('description');
      descControl?.setValue('a'.repeat(49));
      expect(descControl?.errors?.['minlength']).toBeTruthy();
      
      descControl?.setValue('a'.repeat(3001));
      expect(descControl?.errors?.['maxlength']).toBeTruthy();
      
      descControl?.setValue('a'.repeat(100));
      expect(descControl?.errors).toBeNull();
    });

    it('should validate comma-separated values', () => {
      const keywordsControl = component.artifactForm.get('keywords');
      keywordsControl?.setValue('keyword1,,keyword2');
      expect(keywordsControl?.errors?.['invalidFormat']).toBeTruthy();
      
      keywordsControl?.setValue('keyword1,keyword2');
      expect(keywordsControl?.errors).toBeNull();
    });

    it('should validate URLs', () => {
      const linksControl = component.artifactForm.get('links');
      linksControl?.setValue('domain1,,domain2');
      expect(linksControl?.errors?.['invalidLinks']).toBeTruthy();
      
      linksControl?.setValue('domain1.com,domain2.com');
      expect(linksControl?.errors).toBeNull();
    });

    it('should validate DOIs', () => {
      const doiControl = component.artifactForm.get('doi');
      doiControl?.setValue('invalid-doi');
      expect(doiControl?.errors?.['invalidDoi']).toBeTruthy();
      
      doiControl?.setValue('10.1234/valid.doi');
      expect(doiControl?.errors).toBeNull();
    });
  });

  // File Handling Tests
  describe('File Handling', () => {
    it('should handle drag over event', () => {
      const mockEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true
      });
      
      spyOn(mockEvent, 'preventDefault');
      spyOn(mockEvent, 'stopPropagation');
      
      component.onDragOver(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBe(true);
    });

    it('should handle drag leave event', () => {
      const mockEvent = new DragEvent('dragleave', {
        bubbles: true,
        cancelable: true
      });
      
      spyOn(mockEvent, 'preventDefault');
      spyOn(mockEvent, 'stopPropagation');
      
      component.onDragLeave(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBe(false);
    });

    it('should handle single file selection', fakeAsync(() => {
      // Create a small file that's within size limits
      const fileContent = 'test content';
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });
      
      // Mock the calculateFileHash method to return a predictable hash
      spyOn(component as any, 'calculateFileHash').and.returnValue(Promise.resolve('mockedHash'));
      
      component.handleSingleFileSelection(file);
      tick(); // Wait for async operations to complete
      
      expect(component.selectedFile).toBeTruthy();
      expect(component.selectedFile?.name).toBe('test.txt');
      expect(component.fileHash).toBe('mockedHash');
      expect(component.isProcessing).toBe(false);
      expect(component.uploadError).toBe(false);
    }));

    it('should reject empty files', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      
      await component.handleSingleFileSelection(emptyFile);
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('empty');
      expect(component.selectedFile).toBeNull();
    });

    it('should reject oversized files', async () => {
      // Create a mock File object that reports a size larger than the limit
      const mockFile = {
        size: 21 * 1024 * 1024, // 21MB (just over the 20MB limit)
        name: 'large.txt',
        type: 'text/plain'
      } as File;
      
      await component.handleSingleFileSelection(mockFile);
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('exceeds the limit');
      expect(component.selectedFile).toBeNull();
    });

    it('should handle file drop event', fakeAsync(() => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true
      });

      // Mock the dataTransfer after event creation
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
          items: [{
            webkitGetAsEntry: () => ({ isDirectory: false })
          }]
        }
      });

      spyOn(component as any, 'handleSingleFileSelection').and.returnValue(Promise.resolve());
      
      component.onDrop(dropEvent);
      tick();
      
      expect(component.isDragging).toBe(false);
      expect(component['handleSingleFileSelection']).toHaveBeenCalledWith(file);
    }));

    it('should reject folder drop and show error message', fakeAsync(() => {
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true
      });

      // Mock the dataTransfer after event creation
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          items: [{
            webkitGetAsEntry: () => ({ isDirectory: true })
          }]
        }
      });

      component.onDrop(dropEvent);
      tick();
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('Please use the "Select a Folder" button');
    }));

    it('should handle file selection through input element', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockEvent = {
        target: {
          files: [file]
        }
      } as unknown as Event;

      spyOn(component as any, 'handleSingleFileSelection').and.returnValue(Promise.resolve());
      
      await component.handleFileSelection(mockEvent);
      
      expect(component['handleSingleFileSelection']).toHaveBeenCalledWith(file);
    });
  });

  // Utility Function Tests
  describe('Utility Functions', () => {
    it('should format file sizes correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(component.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should reset upload state', () => {
      component.selectedFile = new File(['test'], 'test.txt');
      component.fileHash = 'hash';
      component.uploadError = true;
      component.errorMessage = 'error';
      component.isProcessing = true;
      
      component.resetUpload();
      
      expect(component.selectedFile).toBeNull();
      expect(component.fileHash).toBe('');
      expect(component.uploadError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.isProcessing).toBeFalse();
    });

    it('should handle navigation', () => {
      component.goBack();
      expect(locationSpy.back).toHaveBeenCalled();
    });
  });

  // Form Submission Tests
  describe('Form Submission', () => {
    it('should not submit invalid form', () => {
      // Ensure the form is invalid
      component.artifactForm.patchValue({
        title: '', // required field empty
        description: '' // required field empty
      });
      
      // Reset any previous calls to the service
      artifactServiceSpy.createArtifactMetadataOnly.calls.reset();
      
      // Submit the form
      component.onSubmit();
      
      // Verify service was not called
      expect(artifactServiceSpy.createArtifactMetadataOnly).not.toHaveBeenCalled();
    });

    it('should submit valid form with file', () => {
      // Set up a valid form and file
      component.artifactForm.patchValue({
        title: 'Valid Title',
        description: 'a'.repeat(50),
        keywords: 'key1,key2',
        links: 'domain1.com,domain2.com',
        doi: '10.1234/valid.doi'
      });
      component.selectedFile = new File(['test'], 'test.txt');
      component.fileHash = 'hash';
      
      // Reset any previous calls to the service
      artifactServiceSpy.createArtifactMetadataOnly.calls.reset();
      
      // Submit the form
      component.onSubmit();
      
      // Verify service was called
      expect(artifactServiceSpy.createArtifactMetadataOnly).toHaveBeenCalled();
    });
  });
});