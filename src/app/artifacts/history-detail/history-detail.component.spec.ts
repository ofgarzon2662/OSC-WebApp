import { ComponentFixture, TestBed, fakeAsync, tick, flush, flushMicrotasks } from '@angular/core/testing';
declare const expect: any;
import { HistoryDetailComponent } from './history-detail.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ArtifactService } from '../services/artifact.service';
import { HistoryCacheService } from '../services/history-cache.service';

describe('HistoryDetailComponent', () => {
  let component: HistoryDetailComponent;
  let fixture: ComponentFixture<HistoryDetailComponent>;

  const params = { snapshot: { paramMap: new Map([['id', 'abc'], ['txId', 'tx-1']]) } } as any;

  const serviceStub = {
    getArtifactHistory: (_id: string, opts: any) => {
      const includeValue = !!opts.includeValue;
      const first = { txId: 'tx-0', timestamp: new Date().toISOString(), isDelete: false } as any;
      const second = includeValue
        ? ({ txId: 'tx-1', timestamp: new Date().toISOString(), isDelete: false, value: { manifest: [{ filename: 'a', hash: 'h', algorithm: 'sha256' }] } } as any)
        : ({ txId: 'tx-1', timestamp: new Date().toISOString(), isDelete: false } as any);
      return of({ items: [first, second], total: 2 } as any);
    }
  } as Partial<ArtifactService> as ArtifactService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: params },
        { provide: ArtifactService, useValue: serviceStub },
        HistoryCacheService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads from cache when present', () => {
    const cache = TestBed.inject(HistoryCacheService);
    cache.set('tx-1', { txId: 'tx-1', timestamp: new Date().toISOString(), isDelete: false } as any);
    const comp = TestBed.createComponent(HistoryDetailComponent).componentInstance;
    comp.ngOnInit();
    expect(comp.item?.txId).toBe('tx-1');
    expect(comp.isLoading).toBeFalse();
  });

  it('fetches until found and sets flags', fakeAsync(() => {
    const comp = TestBed.createComponent(HistoryDetailComponent).componentInstance;
    comp.ngOnInit();
    flush();
    tick();
    expect(comp.item?.txId).toBe('tx-1');
    expect([true, false]).toContain(comp.isCurrent);
    expect([true, false]).toContain(comp.isInitial);
    expect(comp.isLoading).toBeFalse();
  }));

  it('shows error when not found', fakeAsync(() => {
    const svc = TestBed.inject(ArtifactService) as any;
    spyOn(svc, 'getArtifactHistory').and.returnValue(of({ items: [], total: 0 }));
    const comp = TestBed.createComponent(HistoryDetailComponent).componentInstance;
    comp.ngOnInit();
    flush();
    tick();
    expect(comp.errorMessage).toContain('not found');
    expect(comp.isLoading).toBeFalse();
  }));

  it('printManifest builds window content safely', fakeAsync(() => {
    // Ensure item with manifest
    component.item = { value: { manifest: [{ filename: 'a', hash: 'h', algorithm: 'sha256' }] } } as any;
    const mockWin = {
      document: {
        createElement: (t: string) => (t === 'style' ? { textContent: '' } : { textContent: '', appendChild: () => {} }),
        head: { appendChild: () => {} },
        body: { innerHTML: '', appendChild: () => {} },
        open: () => {}, write: () => {}, close: () => {}
      },
      focus: () => {}, print: () => {}
    } as unknown as Window;
    spyOn(window, 'open').and.returnValue(mockWin);
    component.printManifest();
    tick(20);
    expect(window.open).toHaveBeenCalled();
  }));
});


