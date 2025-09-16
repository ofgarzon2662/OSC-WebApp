import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateArtifactComponent } from './update-artifact.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ArtifactService } from '../services/artifact.service';
import { ToastrService } from 'ngx-toastr';
import * as CryptoJS from 'crypto-js';
import { ArtifactDetail } from '../../models/artifact-detail.model';

describe('UpdateArtifactComponent', () => {
  let component: UpdateArtifactComponent;
  let fixture: ComponentFixture<UpdateArtifactComponent>;

  let artifactServiceSpy: jasmine.SpyObj<ArtifactService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    artifactServiceSpy = jasmine.createSpyObj('ArtifactService', ['getArtifactById', 'updateArtifactMetadataOnly']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [UpdateArtifactComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '123' })) } },
        { provide: ArtifactService, useValue: artifactServiceSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateArtifactComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    artifactServiceSpy.getArtifactById.and.returnValue(of({} as ArtifactDetail));
    fixture.detectChanges();
    (expect as any)(component).toBeTruthy();
  });

  it('should load artifact on init and prefill form (title/description disabled)', () => {
    const mockDetail: ArtifactDetail = {
      id: '123',
      title: 'Loaded Title',
      description: 'Loaded Description',
      keywords: ['k1', 'k2'],
      links: ['https://a'],
      dois: ['10.1111/abc'],
      fundingAgencies: ['NSF', 'NASA', 'OtherX'],
      acknowledgements: 'Ack',
      manifest: [{ filename: 'f.txt', hash: 'h', algorithm: 'sha256' }],
      submittedAt: '', verified: false, lastTimeVerified: null,
      submissionState: 'PENDING', submitterEmail: '', submitterUsername: '', blockchainTxId: null, peerId: null, submissionError: null,
      organization: { name: 'Org' }
    } as any;

    artifactServiceSpy.getArtifactById.and.returnValue(of(mockDetail));
    fixture.detectChanges();

    (expect as any)(component.artifact).toBeTruthy();
    const raw = component.artifactForm.getRawValue();
    (expect as any)(raw.keywords).toContain('k1');
    (expect as any)(component.artifactForm.get('title')?.disabled).toBeTrue();
    (expect as any)(component.artifactForm.get('description')?.disabled).toBeTrue();
  });

  it('onSubmit should show error when no files selected', () => {
    const mockDetail = { id: '123' } as ArtifactDetail;
    artifactServiceSpy.getArtifactById.and.returnValue(of(mockDetail as any));
    fixture.detectChanges();

    component.selectedFilesData = [];
    component.onSubmit();
    (expect as any)(toastrSpy.error).toHaveBeenCalled();
  });

  it('onSubmit should call update with single file manifest and use file hash as footprint', () => {
    const mockDetail = { id: '123' } as ArtifactDetail;
    artifactServiceSpy.getArtifactById.and.returnValue(of(mockDetail as any));
    artifactServiceSpy.updateArtifactMetadataOnly.and.returnValue(of(void 0));
    fixture.detectChanges();

    component.selectedFilesData = [
      { content: {} as File, name: 'file.txt', hash: 'hash1', size: 10 }
    ];

    component.onSubmit();

    (expect as any)(artifactServiceSpy.updateArtifactMetadataOnly).toHaveBeenCalled();
    const [calledId, dto] = artifactServiceSpy.updateArtifactMetadataOnly.calls.mostRecent().args;
    (expect as any)(calledId).toBe('123');
    (expect as any)(dto.manifest.length).toBe(1);
    (expect as any)(dto.footprint).toBe('hash1');
    (expect as any)(toastrSpy.success).toHaveBeenCalled();
    (expect as any)(component.lastCreatedId).toBe('123');
  });

  it('onSubmit should compute canonical footprint for multiple files', () => {
    const mockDetail = { id: '999' } as ArtifactDetail;
    artifactServiceSpy.getArtifactById.and.returnValue(of(mockDetail as any));
    artifactServiceSpy.updateArtifactMetadataOnly.and.returnValue(of(void 0));
    fixture.detectChanges();

    component.selectedFilesData = [
      { content: {} as File, name: 'b.txt', hash: 'bbb', size: 1 },
      { content: {} as File, name: 'a.txt', hash: 'aaa', size: 1 }
    ];

    component.onSubmit();

    const [, dto] = artifactServiceSpy.updateArtifactMetadataOnly.calls.mostRecent().args;
    const canonical = ['a.txt\taaa\tsha256', 'b.txt\tbbb\tsha256'].join('\n');
    const expectedFootprint = CryptoJS.SHA256(canonical).toString();
    (expect as any)(dto.footprint).toBe(expectedFootprint);
  });

  it('template should show link and disable Update button after success', () => {
    const mockDetail = { id: '777' } as ArtifactDetail;
    artifactServiceSpy.getArtifactById.and.returnValue(of(mockDetail as any));
    artifactServiceSpy.updateArtifactMetadataOnly.and.returnValue(of(void 0));
    fixture.detectChanges();

    component.selectedFilesData = [
      { content: {} as File, name: 'file.txt', hash: 'h', size: 5 }
    ];
    component.onSubmit();
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.form-navigation .btn.btn-primary');
    (expect as any)(button.disabled).toBeTrue();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.form-navigation a.btn.btn-success');
    (expect as any)(link).toBeTruthy();
  });
});
