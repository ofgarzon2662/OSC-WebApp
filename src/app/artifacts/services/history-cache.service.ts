import { Injectable } from '@angular/core';
import { ArtifactHistoryItem } from '../../models/artifact-history.model';

@Injectable({ providedIn: 'root' })
export class HistoryCacheService {
  private readonly maxEntries = 200;
  private readonly cache = new Map<string, ArtifactHistoryItem>();

  get(txId: string): ArtifactHistoryItem | undefined {
    const value = this.cache.get(txId);
    if (!value) return undefined;
    // Promote to most-recent
    this.cache.delete(txId);
    this.cache.set(txId, value);
    return value;
  }

  set(txId: string, item: ArtifactHistoryItem): void {
    if (!txId) return;
    if (this.cache.has(txId)) this.cache.delete(txId);
    this.cache.set(txId, item);
    this.evictIfNeeded();
  }

  clear(): void {
    this.cache.clear();
  }

  private evictIfNeeded(): void {
    while (this.cache.size > this.maxEntries) {
      const iterator = this.cache.keys();
      const first = iterator.next();
      if (first.done) break;
      const oldestKey = first.value;
      this.cache.delete(oldestKey);
    }
  }
}


