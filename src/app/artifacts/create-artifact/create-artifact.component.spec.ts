import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CreateArtifactComponent } from './create-artifact.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ArtifactService } from '../services/artifact.service';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';

// Add Jasmine types
declare const jasmine: any;

// Create helper interface for mock FileReader
interface MockFileReader {
  readAsArrayBuffer: () => void;
  onload?: (event: any) => void;
  onerror?: () => void;
}

// Create a custom mock File class that includes webkitRelativePath
class MockFileWithPath extends File {
  private _webkitRelativePath: string;

  constructor(parts: BlobPart[], filename: string, options: FilePropertyBag, relativePath: string) {
    super(parts, filename, options);
    this._webkitRelativePath = relativePath;
  }

  override get webkitRelativePath(): string {
    return this._webkitRelativePath;
  }
}

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

  // Helper function to create mock FileList
  function createMockFileList(files: File[]): FileList {
    const fileList: Partial<FileList> = {
      length: files.length,
      item: (index: number) => index < files.length ? files[index] : null
    };
    
    // Add array-like indexed access
    files.forEach((file, index) => {
      fileList[index] = file;
    });
    
    return fileList as FileList;
  }

  // Helper function to create a mock file with path
  function createMockFileWithPath(content: string | ArrayBuffer, filename: string, relativePath: string): File {
    return new MockFileWithPath(
      [content], 
      filename, 
      { type: filename.endsWith('.txt') ? 'text/plain' : 'application/octet-stream' },
      relativePath
    );
  }

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

    it('should validate empty values for comma-separated fields', () => {
      const keywordsControl = component.artifactForm.get('keywords');
      keywordsControl?.setValue('');
      expect(keywordsControl?.errors).toBeNull();
      
      const otherAgencyControl = component.artifactForm.get('otherAgency');
      otherAgencyControl?.setValue('');
      expect(otherAgencyControl?.errors).toBeNull();
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
    
    it('should validate multiple DOIs', () => {
      const doiControl = component.artifactForm.get('doi');
      doiControl?.setValue('10.1234/valid.doi,invalid-doi');
      expect(doiControl?.errors?.['invalidDoi']).toBeTruthy();
      
      doiControl?.setValue('10.1234/valid.doi,10.5678/another.valid.doi');
      expect(doiControl?.errors).toBeNull();
    });
    
    it('should validate acknowledgment length', () => {
      const ackControl = component.artifactForm.get('acknowledgment');
      ackControl?.setValue('a'.repeat(3001));
      expect(ackControl?.errors?.['maxlength']).toBeTruthy();
      
      ackControl?.setValue('a'.repeat(3000));
      expect(ackControl?.errors).toBeNull();
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

    it('should handle folder selection through input element', async () => {
      const files = [
        new File(['file1 content'], 'folder/file1.txt', { type: 'text/plain' }),
        new File(['file2 content'], 'folder/file2.txt', { type: 'text/plain' })
      ];
      
      const mockEvent = {
        target: {
          files: createMockFileList(files)
        }
      } as unknown as Event;
      
      spyOn(component as any, 'handleFolderSelection').and.returnValue(Promise.resolve());
      
      await component.handleFileSelection(mockEvent);
      
      expect(component['handleFolderSelection']).toHaveBeenCalled();
    });

    it('should do nothing for empty file selection', async () => {
      const mockEvent = {
        target: {
          files: null
        }
      } as unknown as Event;
      
      spyOn(component as any, 'handleSingleFileSelection');
      spyOn(component as any, 'handleFolderSelection');
      
      await component.handleFileSelection(mockEvent);
      
      expect(component['handleSingleFileSelection']).not.toHaveBeenCalled();
      expect(component['handleFolderSelection']).not.toHaveBeenCalled();
    });

    it('should handle error when calculating file hash', fakeAsync(() => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      spyOn(component as any, 'calculateFileHash').and.returnValue(Promise.reject(new Error('Hash error')));
      
      component.handleSingleFileSelection(file);
      tick();
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('Error processing file');
      expect(component.isProcessing).toBe(false);
    }));
    
    it('should handle folder with valid files', fakeAsync(() => {
      // Create mock folder with files using our helper method
      const files = [
        createMockFileWithPath('file1 content', 'file1.txt', 'folder/file1.txt'),
        createMockFileWithPath('file2 content', 'file2.txt', 'folder/file2.txt')
      ];
      
      const fileList = createMockFileList(files);
      
      // Mock array buffer creation
      spyOn(File.prototype, 'arrayBuffer').and.callFake(function(this: File) {
        return Promise.resolve(new Uint8Array(this.size).buffer);
      });
      
      component.handleFolderSelection(fileList);
      tick(1000); // Allow async operations to complete
      
      expect(component.selectedFile).toBeTruthy();
      expect(component.selectedFile?.name).toBe('folder');
      expect(component.fileHash).not.toBe('');
      expect(component.isProcessing).toBe(false);
      expect(component.uploadError).toBe(false);
    }));
    
    it('should reject empty folders', fakeAsync(() => {
      const emptyFiles = createMockFileList([]);
      
      component.handleFolderSelection(emptyFiles);
      tick();
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('empty');
      expect(component.selectedFile).toBeNull();
    }));
    
    it('should reject folders with too many files', fakeAsync(() => {
      // Create a folder with more than MAX_FILES_IN_FOLDER files
      const tooManyFiles = Array(51).fill(null).map((_, i) => 
        createMockFileWithPath('content', `file${i}.txt`, `folder/file${i}.txt`)
      );
      
      const fileList = createMockFileList(tooManyFiles);
      
      component.handleFolderSelection(fileList);
      tick();
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('too many files');
      expect(component.selectedFile).toBeNull();
    }));
    
    it('should reject folders that exceed size limit', fakeAsync(() => {
      // Create a folder with files that exceed MAX_FOLDER_SIZE
      // Create a large buffer for testing size limits
      const largeBuffer = new ArrayBuffer(21 * 1024 * 1024); // 21MB (just over the 20MB limit)
      
      const largeFile = createMockFileWithPath(largeBuffer, 'large.bin', 'folder/large.bin');
      // Override size property since we can't directly set it
      Object.defineProperty(largeFile, 'size', { value: 21 * 1024 * 1024 });
      
      const filesWithLargeOne = createMockFileList([largeFile]);
      
      component.handleFolderSelection(filesWithLargeOne);
      tick();
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('exceeds the limit');
      expect(component.selectedFile).toBeNull();
    }));
    
    it('should handle error during folder processing', fakeAsync(() => {
      const files = [
        createMockFileWithPath('file1 content', 'file1.txt', 'folder/file1.txt')
      ];
      
      const fileList = createMockFileList(files);
      
      // Make arrayBuffer throw an error
      spyOn(File.prototype, 'arrayBuffer').and.returnValue(Promise.reject(new Error('Processing error')));
      
      component.handleFolderSelection(fileList);
      tick();
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('Processing error');
      expect(component.isProcessing).toBe(false);
    }));
  });
  
  // Reset and Navigation Tests
  describe('Reset and Navigation Methods', () => {
    it('should reset upload state', () => {
      // Set up initial state
      component.selectedFile = new File(['content'], 'test.txt');
      component.fileHash = 'hash123';
      component.uploadError = true;
      component.errorMessage = 'Some error';
      component.isProcessing = true;
      
      // Add mock file inputs
      component.fileInput = { nativeElement: { value: 'test' } } as any;
      component.folderInput = { nativeElement: { value: 'test' } } as any;
      
      component.resetUpload();
      
      expect(component.selectedFile).toBeNull();
      expect(component.fileHash).toBe('');
      expect(component.uploadError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.isProcessing).toBe(false);
      expect(component.fileInput.nativeElement.value).toBe('');
      expect(component.folderInput.nativeElement.value).toBe('');
    });
    
    it('should navigate back when goBack is called', () => {
      component.goBack();
      expect(locationSpy.back).toHaveBeenCalled();
    });
    
    it('should reset form completely', () => {
      // Fill form with values
      component.artifactForm.setValue({
        title: 'Test Title',
        description: 'Test Description',
        keywords: 'key1,key2',
        links: 'link1,link2',
        doi: '10.1234/test',
        nsf: true,
        nih: true,
        noaa: true,
        nasa: true,
        otherAgency: 'other1,other2',
        acknowledgment: 'Test acknowledgment'
      });
      
      // Set up file state
      component.selectedFile = new File(['content'], 'test.txt');
      component.fileHash = 'hash123';
      component.isSubmitted = true;
      component.isSubmitting = true;
      
      component.resetForm();
      
      // Check form was reset
      const formValues = component.artifactForm.value;
      expect(formValues.title).toBeFalsy();
      expect(formValues.description).toBeFalsy();
      expect(formValues.keywords).toBeFalsy();
      expect(formValues.links).toBeFalsy();
      expect(formValues.doi).toBeFalsy();
      expect(formValues.nsf).toBe(false);
      expect(formValues.nih).toBe(false);
      expect(formValues.noaa).toBe(false);
      expect(formValues.nasa).toBe(false);
      expect(formValues.otherAgency).toBeFalsy();
      expect(formValues.acknowledgment).toBeFalsy();
      
      // Check file state was reset
      expect(component.selectedFile).toBeNull();
      expect(component.fileHash).toBe('');
      expect(component.isSubmitted).toBe(false);
      expect(component.isSubmitting).toBe(false);
    });
  });
  
  // Form Submission Tests
  describe('Form Submission', () => {
    beforeEach(() => {
      // Reset service spy
      artifactServiceSpy.createArtifactMetadataOnly.calls.reset();
      
      // Use of() directly without accessing internal Observable properties
      artifactServiceSpy.createArtifactMetadataOnly.and.returnValue(of({}));
      
      // Set up valid form state
      component.artifactForm.setValue({
        title: 'Test Title',
        description: 'Test Description with at least 50 characters to meet minimum length requirement',
        keywords: 'key1,key2',
        links: 'link1.com,link2.com',
        doi: '10.1234/test',
        nsf: true,
        nih: false,
        noaa: true,
        nasa: false,
        otherAgency: 'other1,other2',
        acknowledgment: 'Test acknowledgment'
      });
      
      // Set up valid file state
      component.selectedFile = new File(['content'], 'test.txt');
      component.fileHash = 'hash123';
      component.isProcessing = false;
    });
    
    it('should submit valid form and file data', fakeAsync(() => {
      spyOn(console, 'log');
      
      // Spy on resetForm to prevent it from actually resetting the form
      spyOn(component, 'resetForm').and.callFake(() => {
        // Just manually set these values instead of full reset
        component.isSubmitted = true; 
        component.isProcessing = false;
      });
      
      component.onSubmit();
      tick();
      
      expect(component.isSubmitting).toBe(true);
      expect(artifactServiceSpy.createArtifactMetadataOnly).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        title: 'Test Title',
        description: 'Test Description with at least 50 characters to meet minimum length requirement',
        keywords: ['key1', 'key2'],
        links: ['link1.com', 'link2.com'],
        dois: ['10.1234/test'],
        fundingAgencies: ['NSF', 'NOAA', 'other1', 'other2'],
        acknowledgements: 'Test acknowledgment',
        fileName: 'test.txt',
        hash: 'hash123'
      }));
      
      // Simulate the response from the service
      // Fix: don't rely on internal Observable implementation details
      tick();
      
      expect(toastrSpy.success).toHaveBeenCalled();
      expect(component.resetForm).toHaveBeenCalled();
      expect(component.isSubmitted).toBe(true);
    }));
    
    it('should submit form with empty arrays as [""] when no values are provided', fakeAsync(() => {
      // Set form with empty arrays
      component.artifactForm.patchValue({
        keywords: '',
        links: '',
        doi: '',
        nsf: false,
        nih: false,
        noaa: false,
        nasa: false,
        otherAgency: '',
        acknowledgment: ''
      });
      
      // Spy on resetForm
      spyOn(component, 'resetForm').and.callFake(() => {
        // Just manually set these values instead of full reset
        component.isSubmitted = true; 
        component.isProcessing = false;
      });
      
      component.onSubmit();
      tick();
      
      expect(artifactServiceSpy.createArtifactMetadataOnly).toHaveBeenCalledWith(jasmine.objectContaining({
        keywords: [''],
        links: [''],
        dois: [''],
        fundingAgencies: [''],
        acknowledgements: ''
      }));
      
      // Simulate the response from the service
      // Fix: don't rely on internal Observable implementation details
      tick();
      
      expect(toastrSpy.success).toHaveBeenCalled();
      expect(component.resetForm).toHaveBeenCalled();
    }));
    
    it('should handle error during submission', fakeAsync(() => {
      const errorResponse = { message: 'Server error' };
      artifactServiceSpy.createArtifactMetadataOnly.and.returnValue(
        throwError(() => errorResponse)
      );
      
      // Spy on showError to verify it's called with the right message
      spyOn(component as any, 'showError').and.callThrough();
      
      component.onSubmit();
      tick();
      
      // Verify error handling
      expect(component['showError']).toHaveBeenCalled();
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toContain('Error creating artifact');
      expect(component.isProcessing).toBe(false);
    }));
    
    it('should log error for invalid form', () => {
      // Make form invalid
      component.artifactForm.get('title')?.setValue('');
      spyOn(console, 'log');
      
      component.onSubmit();
      
      expect(console.log).toHaveBeenCalledWith('Form invalid', component.artifactForm);
      expect(component.isSubmitting).toBe(false);
      expect(artifactServiceSpy.createArtifactMetadataOnly).not.toHaveBeenCalled();
    });
    
    it('should not submit when there is no selected file', () => {
      component.selectedFile = null;
      
      component.onSubmit();
      
      expect(artifactServiceSpy.createArtifactMetadataOnly).not.toHaveBeenCalled();
    });
    
    it('should not submit when there is no file hash', () => {
      component.fileHash = '';
      
      component.onSubmit();
      
      expect(artifactServiceSpy.createArtifactMetadataOnly).not.toHaveBeenCalled();
    });
    
    it('should not submit when processing is in progress', () => {
      component.isProcessing = true;
      
      component.onSubmit();
      
      expect(artifactServiceSpy.createArtifactMetadataOnly).not.toHaveBeenCalled();
    });
  });

  // Utility Method Tests
  describe('Utility Methods', () => {
    it('should format file size correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1023)).toBe('1023 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1048576)).toBe('1 MB');
      expect(component.formatFileSize(1073741824)).toBe('1 GB');
      expect(component.formatFileSize(1572864)).toBe('1.5 MB');
    });
    
    it('should show error message', () => {
      const errorMethod = component['showError'].bind(component);
      
      errorMethod('Test error message');
      
      expect(component.uploadError).toBe(true);
      expect(component.errorMessage).toBe('Test error message');
      expect(component.selectedFile).toBeNull();
      expect(component.fileHash).toBe('');
    });
    
    it('should calculate file hash correctly', fakeAsync(() => {
      const file = new File(['test content'], 'test.txt');
      
      // Create a mock FileReader that simulates reading the file
      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: function() {
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: new TextEncoder().encode('test content').buffer } });
            }
          }, 10);
        }
      };
      
      spyOn(window, 'FileReader').and.returnValue(mockFileReader as any);
      
      let result: string | undefined;
      (component as any).calculateFileHash(file).then((hash: string) => {
        result = hash;
      });
      
      tick(20);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result?.length).toBeGreaterThan(0);
    }));
    
    it('should handle file reader error', fakeAsync(() => {
      const file = new File(['test content'], 'test.txt');
      
      // Create a mock FileReader that simulates an error
      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: function() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 10);
        }
      };
      
      spyOn(window, 'FileReader').and.returnValue(mockFileReader as any);
      
      let error: Error | undefined;
      (component as any).calculateFileHash(file).catch((e: Error) => {
        error = e;
      });
      
      tick(20);
      
      expect(error).toBeDefined();
      expect(error?.message).toBe('Failed to read file');
    }));
  });
});