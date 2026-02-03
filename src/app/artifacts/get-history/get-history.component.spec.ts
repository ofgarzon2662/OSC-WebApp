import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
declare const expect: any;
import { GetHistoryComponent } from './get-history.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ArtifactService } from '../services/artifact.service';
import { ArtifactHistoryItem } from '../../models/artifact-history.model';

describe('GetHistoryComponent', () => {
  let component: GetHistoryComponent;
  let fixture: ComponentFixture<GetHistoryComponent>;

  const makeItem = (i: number): ArtifactHistoryItem => ({
    txId: `tx-${i}`,
    timestamp: new Date(Date.now() - i * 1000).toISOString(),
    isDelete: false,
    value: { filename: `f-${i}`, hash: `h-${i}`, algorithm: 'sha256' } as any
  } as any);

  const historyPage = (offset: number, limit: number, includeValue: boolean) => {
    const items: ArtifactHistoryItem[] = [];
    for (let i = offset; i < offset + limit; i++) {
      items.push(includeValue ? makeItem(i) : ({ txId: `tx-${i}`, timestamp: new Date().toISOString(), isDelete: false } as any));
    }
    return { items, total: 100 } as any;
  };

  const artifactServiceStub = {
    getArtifactHistory: (_id: string, opts: any) => of(historyPage(opts.offset, opts.limit, !!opts.includeValue)),
    refreshArtifactHistory: (_id: string, _opts: any) => of({}),
    getArtifactById: (_id: string) => of({ title: 't', description: 'd' } as any)
  } as Partial<ArtifactService> as ArtifactService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetHistoryComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'abc']]) } } },
        { provide: ArtifactService, useValue: artifactServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GetHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads headers and first page on init', fakeAsync(() => {
    let ready = false;
    (component as any).loadAllHeaders().then(() => {
      (component as any).loadUiPage(1);
      ready = true;
    });
    flush();
    tick();
    expect(ready).toBeTrue();
    expect((component as any).headers.length).toBeGreaterThan(0);
    expect(component.displayedItems.length).toBeGreaterThan(0);
    expect(component.isLoading).toBeFalse();
  }));

  it('navigates pages using onNext/onPrev', fakeAsync(() => {
    let ready = false;
    (component as any).loadAllHeaders().then(() => {
      (component as any).loadUiPage(1);
      ready = true;
    });
    flush();
    tick();
    expect(ready).toBeTrue();
    const first = component.displayedItems.map(i => i.txId).join(',');
    component.onNext();
    flush();
    tick();
    const second = component.displayedItems.map(i => i.txId).join(',');
    expect(second).not.toEqual(first);
    component.onPrev();
    flush();
    tick();
    const back = component.displayedItems.map(i => i.txId).join(',');
    expect(back).toEqual(first);
  }));

  it('onGoToPage ignores out-of-range values', fakeAsync(() => {
    (component as any).loadAllHeaders().then(() => (component as any).loadUiPage(1));
    flush();
    tick();
    const before = component.uiPage;
    component.onGoToPage(0);
    component.onGoToPage((component.totalUiPages || 1) + 5);
    expect(component.uiPage).toEqual(before);
  }));

  it('getUiPages returns compact list with ellipsis', () => {
    (component as any).totalUiPages = 20;
    component.uiPage = 10;
    const pages = component.getUiPages();
    expect(pages[0]).toEqual(1);
    expect(pages[pages.length - 1]).toEqual(20);
    expect(pages).toContain('...');
  });

  it('refreshes history without throwing', fakeAsync(() => {
    component.onRefresh();
    flush();
    tick();
    expect(component.isLoading).toBeFalse();
  }));

  it('sets errorMessage when page load fails', fakeAsync(() => {
    flush();
    tick();
    spyOn(component as any, 'ensureItemsForTxIds').and.returnValue(Promise.reject('fail'));
    (component as any).loadUiPage(component.uiPage);
    flush();
    tick();
    expect(component.errorMessage).toBeTruthy();
    expect(component.isLoading).toBeFalse();
  }));
});


