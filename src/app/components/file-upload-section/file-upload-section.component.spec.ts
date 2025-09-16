import { ComponentFixture, TestBed } from '@angular/core/testing';
declare const expect: any;
import { FileUploadSectionComponent } from './file-upload-section.component';

describe('FileUploadSectionComponent', () => {
  let component: FileUploadSectionComponent;
  let fixture: ComponentFixture<FileUploadSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders hint text when provided', () => {
    component.hintText = 'Use me';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Use me');
  });

  it('emits selectFolder/selectFile from buttons', () => {
    spyOn(component.selectFolder, 'emit');
    spyOn(component.selectFile, 'emit');
    const el: HTMLElement = fixture.nativeElement;
    const buttons = Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];
    const folderBtn = buttons.find(b => b.textContent?.includes('Select a Folder'))!;
    const fileBtn = buttons.find(b => b.textContent?.includes('Select a File'))!;
    folderBtn.click();
    fileBtn.click();
    expect(component.selectFolder.emit).toHaveBeenCalled();
    expect(component.selectFile.emit).toHaveBeenCalled();
  });

  it('emits drag events from drop zone', () => {
    spyOn(component.fileDragOver, 'emit');
    spyOn(component.fileDragLeave, 'emit');
    spyOn(component.fileDrop, 'emit');
    const el: HTMLElement = fixture.nativeElement;
    const dropZone = el.querySelector('.drop-zone') as HTMLElement;
    dropZone.dispatchEvent(new DragEvent('dragover'));
    dropZone.dispatchEvent(new DragEvent('dragleave'));
    dropZone.dispatchEvent(new DragEvent('drop'));
    expect(component.fileDragOver.emit).toHaveBeenCalled();
    expect(component.fileDragLeave.emit).toHaveBeenCalled();
    expect(component.fileDrop.emit).toHaveBeenCalled();
  });

  it('shows success state and emits resetUpload when clicking choose different', () => {
    component.selectedFilesData = [{ name: 'a/b.txt', hash: 'h', size: 10, content: new File(['x'], 'b.txt') } as any];
    component.isProcessing = false;
    component.footprintPreview = 'abc';
    fixture.detectChanges();
    spyOn(component.resetUpload, 'emit');
    const el: HTMLElement = fixture.nativeElement;
    const btn = Array.from(el.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Choose Different File/Folder')) as HTMLButtonElement;
    btn.click();
    expect(component.resetUpload.emit).toHaveBeenCalled();
  });

  it('renders file list items and formats name', () => {
    component.selectedFilesData = [
      { name: 'dir/file1.txt', hash: 'h1', size: 1024, content: new File(['a'], 'file1.txt') } as any,
      { name: 'file2.txt', hash: 'h2', size: 2048, content: new File(['b'], 'file2.txt') } as any,
    ];
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('.file-item');
    expect(items.length).toBe(2);
    expect(el.textContent).toContain('file1.txt');
    expect(el.textContent).toContain('file2.txt');
  });
});


