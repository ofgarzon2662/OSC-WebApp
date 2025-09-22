import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
declare const expect: any;
import { UpdateArtifactComponent } from './update-artifact.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ArtifactService } from '../services/artifact.service';
import { ToastrService } from 'ngx-toastr';
import * as CryptoJS from 'crypto-js';

describe('UpdateArtifactComponent', () => {
  let component: UpdateArtifactComponent;
  let fixture: ComponentFixture<UpdateArtifactComponent>;

  const mockArtifact: any = {
    id: 'abc',
    title: 'T',
    description: 'D',
    keywords: ['k1'],
    links: ['https://a'],
    dois: ['10.1/x'],
    fundingAgencies: ['NSF'],
    acknowledgements: 'a',
    manifest: [
      { filename: 'b.txt', hash: 'bbb', algorithm: 'sha256' },
      { filename: 'a.txt', hash: 'aaa', algorithm: 'sha256' }
    ],
    footprint: 'original-foot'
  };

  const artifactServiceStub = {
    getArtifactById: () => of(mockArtifact),
    updateArtifactMetadataOnly: () => of(void 0)
  } as Partial<ArtifactService> as ArtifactService;

  const toastrStub = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error')
  } as unknown as ToastrService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateArtifactComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', 'abc']])) } },
        { provide: ArtifactService, useValue: artifactServiceStub },
        { provide: ToastrService, useValue: toastrStub },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateArtifactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('isFormAndFileValid respects keepManifestUnchanged=false and file selection', fakeAsync(() => {
    tick();
    component.keepManifestUnchanged = false;
    component.isProcessing = false;
    component.artifactForm.patchValue({ title: 'abc', description: 'x'.repeat(60), keywords: 'a' });
    expect(component.isFormAndFileValid()).toBeFalse();
    component.selectedFilesData = [{ name: 'x', size: 1, hash: 'h' } as any];
    expect(component.isFormAndFileValid()).toBeTrue();
  }));

  it('isFormAndFileValid uses hasMetadataChanges when keepManifestUnchanged=true', fakeAsync(() => {
    tick();
    component.keepManifestUnchanged = true;
    component.artifactForm.patchValue({ title: 'abc', description: 'x'.repeat(60) });
    spyOn<any>(component, 'hasMetadataChanges').and.returnValue(false);
    expect(component.isFormAndFileValid()).toBeFalse();
    (component as any).hasMetadataChanges.and.returnValue(true);
    expect(component.isFormAndFileValid()).toBeTrue();
  }));

  it('onToggleKeepManifest clears selected files when toggled on', () => {
    component.selectedFilesData = [{ name: 'x', size: 1, hash: 'h' } as any];
    component.onToggleKeepManifest(true);
    expect(component.keepManifestUnchanged).toBeTrue();
    expect(component.selectedFilesData.length).toBe(0);
  });

  it('onSubmit shows error when invalid', fakeAsync(() => {
    component.keepManifestUnchanged = false;
    component.selectedFilesData = [];
    component['artifact'] = mockArtifact;
    component.onSubmit();
    expect(toastrStub.error).toHaveBeenCalled();
    expect(component['isSubmitting']).toBeFalse();
  }));

  it('onSubmit sends metadata-only update when keeping manifest', fakeAsync(() => {
    component.keepManifestUnchanged = true;
    // Ensure it is considered valid (metadata changed)
    component.artifactForm.patchValue({ keywords: 'changed' });
    spyOn<any>(component, 'hasMetadataChanges').and.returnValue(true);
    spyOn(component as any, 'isFormAndFileValid').and.returnValue(true);

    const svc = TestBed.inject(ArtifactService);
    const spy = spyOn(svc, 'updateArtifactMetadataOnly').and.returnValue(of(void 0));

    component['artifact'] = mockArtifact;
    component.onSubmit();
    tick();

    expect(spy).toHaveBeenCalled();
    const dto = spy.calls.mostRecent().args[1];
    expect(dto.manifest.length).toBe(mockArtifact.manifest.length);
    expect(dto.footprint).toBe(mockArtifact.footprint);
    expect(component['lastCreatedId']).toBe(mockArtifact.id);
  }));

  it('onSubmit rebuilds manifest and uses single-file footprint when one file', fakeAsync(() => {
    component.keepManifestUnchanged = false;
    component.selectedFilesData = [{ name: 'a.txt', hash: 'zzz', size: 10 } as any];
    // ensure form valid
    component.artifactForm.patchValue({ keywords: '' });
    component['artifact'] = mockArtifact;
    spyOn(component as any, 'isFormAndFileValid').and.returnValue(true);

    const svc = TestBed.inject(ArtifactService);
    const spy = spyOn(svc, 'updateArtifactMetadataOnly').and.returnValue(of(void 0));

    component.onSubmit();
    tick();

    const dto = spy.calls.mostRecent().args[1];
    expect(dto.manifest.length).toBe(1);
    expect(dto.footprint).toBe('zzz');
  }));

  it('onSubmit rebuilds manifest and hashes canonical list when multiple files', fakeAsync(() => {
    component.keepManifestUnchanged = false;
    component.selectedFilesData = [
      { name: 'b.txt', hash: '2', size: 10 } as any,
      { name: 'a.txt', hash: '1', size: 10 } as any
    ];
    component['artifact'] = mockArtifact;
    spyOn(component as any, 'isFormAndFileValid').and.returnValue(true);
    const svc = TestBed.inject(ArtifactService);
    const spyUpdate = spyOn(svc, 'updateArtifactMetadataOnly').and.returnValue(of(void 0));

    spyOn(CryptoJS, 'SHA256').and.returnValue({ toString: () => 'hashed' } as any);

    component.onSubmit();
    tick();

    const dto = spyUpdate.calls.mostRecent().args[1];
    expect(dto.manifest.length).toBe(2);
    expect(dto.footprint).toBe('hashed');
  }));

  it('handles service error on submit', fakeAsync(() => {
    const svc = TestBed.inject(ArtifactService);
    spyOn(svc, 'updateArtifactMetadataOnly').and.returnValue(throwError(() => new Error('boom')));
    component.keepManifestUnchanged = false;
    component.selectedFilesData = [{ name: 'f', hash: 'h', size: 1 } as any];
    component['artifact'] = mockArtifact;
    component.onSubmit();
    tick();
    expect(toastrStub.error).toHaveBeenCalled();
  }));
});
