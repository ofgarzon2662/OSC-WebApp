import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ArtifactService } from '../services/artifact.service';
import { ArtifactHistoryItem } from '../../models/artifact-history.model';
import { ArtifactDetail } from '../../models/artifact-detail.model';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-get-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './get-history.component.html',
  styleUrls: ['./get-history.component.css']
})
export class GetHistoryComponent implements OnInit {
  artifactId?: string;
  isLoading = true;
  displayedItems: ArtifactHistoryItem[] = [];
  errorMessage = '';
  artifactTitle = '';
  artifactDescription = '';

  // Pagination (server = 25, UI = 10)
  readonly serverPageSize = 25;
  readonly uiPageSize = 10;
  uiPage = 1;
  totalItems = 0;
  totalUiPages = 0;
  globalStartIndex = 0; // start index for current UI page
  isFirstPage = true;

  // Header index (sorted globally by timestamp desc)
  private headers: Array<{ txId: string; timestamp: string; isDelete: boolean }> = [];

  // Cache by txId for full items
  private txIdToItem = new Map<string, ArtifactHistoryItem>();
  private txIdToServerPage = new Map<string, number>();

  // Small LRU cache for server pages
  private maxCachedServerPages = 3;
  private serverPageCache = new Map<number, ArtifactHistoryItem[]>();
  private serverPageRecency: number[] = []; // most recent at end

  constructor(
    private readonly route: ActivatedRoute,
    private readonly artifactService: ArtifactService
  ) {}

  ngOnInit(): void {
    this.artifactId = this.route.snapshot.paramMap.get('id') ?? undefined;
    if (!this.artifactId) {
      this.isLoading = false;
      return;
    }

    // Fetch title (detail) for header display and first history page
    this.artifactService.getArtifactById(this.artifactId).pipe(
      switchMap((detail: ArtifactDetail) => {
        this.artifactTitle = detail?.title ?? '';
        this.artifactDescription = detail?.description ?? '';
        return of(true);
      })
    ).subscribe({
      next: async () => {
        await this.loadAllHeaders();
        this.loadUiPage(1);
      },
      error: async () => {
        await this.loadAllHeaders();
        this.loadUiPage(1);
      }
    });
  }

  // UI events
  onGoToPage(page: number): void {
    if (page < 1 || (this.totalUiPages && page > this.totalUiPages)) return;
    this.loadUiPage(page);
  }

  onPrev(): void { this.onGoToPage(this.uiPage - 1); }
  onNext(): void { this.onGoToPage(this.uiPage + 1); }

  // Core paging logic
  private loadUiPage(page: number): void {
    if (!this.artifactId) return;
    this.isLoading = true;
    this.uiPage = page;
    this.isFirstPage = this.uiPage === 1;
    this.globalStartIndex = (this.uiPage - 1) * this.uiPageSize;
    const globalEnd = this.globalStartIndex + this.uiPageSize;

    const neededHeaders = this.headers.slice(this.globalStartIndex, globalEnd);
    const neededTxIds = new Set(neededHeaders.map(h => h.txId));

    this.ensureItemsForTxIds(Array.from(neededTxIds))
      .then(() => {
        // Build displayed items in the same order as headers
        this.displayedItems = neededHeaders
          .map(h => this.txIdToItem.get(h.txId))
          .filter((it): it is ArtifactHistoryItem => !!it);
        this.isLoading = false;
      })
      .catch(() => {
        this.errorMessage = 'Unable to load artifact history.';
        this.isLoading = false;
      });
  }

  private async getServerPage(serverPageIndex: number): Promise<ArtifactHistoryItem[]> {
    const cached = this.serverPageCache.get(serverPageIndex);
    if (cached) {
      this.touchRecency(serverPageIndex);
      return cached;
    }

    const offset = serverPageIndex * this.serverPageSize;

    const res = await this.artifactService
      .getArtifactHistory(this.artifactId!, { offset, limit: this.serverPageSize, order: 'desc', includeValue: true })
      .toPromise();

    const items = (res?.items ?? []).slice().sort((a, b) => {
      const at = new Date(a.timestamp).getTime();
      const bt = new Date(b.timestamp).getTime();
      return bt - at; // ensure newest first inside the page
    });

    if (!this.totalItems && res) {
      this.totalItems = res.total ?? items.length;
      this.totalUiPages = Math.max(1, Math.ceil(this.totalItems / this.uiPageSize));
    }

    this.putInCache(serverPageIndex, items);
    // Update txId cache
    for (const it of items) {
      if (it?.txId) this.txIdToItem.set(it.txId, it);
    }
    return items;
  }

  private putInCache(index: number, items: ArtifactHistoryItem[]): void {
    if (this.serverPageCache.has(index)) {
      this.serverPageCache.set(index, items);
      this.touchRecency(index);
      return;
    }
    this.serverPageCache.set(index, items);
    this.serverPageRecency.push(index);
    if (this.serverPageRecency.length > this.maxCachedServerPages) {
      const evict = this.serverPageRecency.shift();
      if (evict !== undefined) this.serverPageCache.delete(evict);
    }
  }

  private touchRecency(index: number): void {
    const pos = this.serverPageRecency.indexOf(index);
    if (pos >= 0) this.serverPageRecency.splice(pos, 1);
    this.serverPageRecency.push(index);
  }

  // Load only headers (no values) and build global timestamp order
  private async loadAllHeaders(): Promise<void> {
    if (!this.artifactId) return;
    const headers: Array<{ txId: string; timestamp: string; isDelete: boolean }> = [];
    let offset = 0;
    let total = 0;
    let absoluteIndex = 0;
    do {
      const res = await this.artifactService
        .getArtifactHistory(this.artifactId, { offset, limit: this.serverPageSize, order: 'desc', includeValue: false })
        .toPromise();
      const items = res?.items ?? [];
      total = res?.total ?? total;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        headers.push({ txId: it.txId, timestamp: it.timestamp, isDelete: it.isDelete });
        const serverPageIndex = Math.floor((offset + i) / this.serverPageSize);
        if (it?.txId) this.txIdToServerPage.set(it.txId, serverPageIndex);
        absoluteIndex++;
      }
      offset += this.serverPageSize;
      if (!res || items.length === 0) break;
    } while (offset < (total || Number.MAX_SAFE_INTEGER));

    headers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    this.headers = headers;
    this.totalItems = headers.length;
    this.totalUiPages = Math.max(1, Math.ceil(this.totalItems / this.uiPageSize));
  }

  // Ensure we have full items (with value) for the given txIds
  private async ensureItemsForTxIds(txIds: string[]): Promise<void> {
    const missing = txIds.filter(tx => !this.txIdToItem.has(tx));
    if (missing.length === 0) return;

    const indices = new Set<number>();
    for (const tx of missing) {
      const idx = this.txIdToServerPage.get(tx);
      if (idx !== undefined) indices.add(idx);
    }
    // Fallback: if some have no index (shouldn't happen), check the first few pages
    if (indices.size === 0) indices.add(0);

    await Promise.all(Array.from(indices).map(i => this.getServerPage(i)));
  }

  // Pager helper to show at most 10 pages with ellipsis
  getUiPages(): (number | string)[] {
    const total = this.totalUiPages;
    const current = this.uiPage;
    const maxShown = 10;
    if (total <= maxShown) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const delta = 2;
    const left = Math.max(1, current - delta);
    const right = Math.min(total, current + delta);
    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);
    for (let i = left; i <= right; i++) pages.add(i);

    // Fill near left
    while (pages.size < Math.min(maxShown - 2, total - 2) && Math.min(...pages) > 2) {
      pages.add(Math.min(...pages) - 1);
    }
    // Fill near right
    while (pages.size < Math.min(maxShown - 2, total - 2) && Math.max(...pages) < total - 1) {
      pages.add(Math.max(...pages) + 1);
    }

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: (number | string)[] = [];
    let prev: number | null = null;
    for (const p of sorted) {
      if (prev !== null) {
        if (p - prev === 2) result.push(prev + 1);
        else if (p - prev > 2) result.push('...');
      }
      result.push(p);
      prev = p;
    }
    return result;
  }
}


