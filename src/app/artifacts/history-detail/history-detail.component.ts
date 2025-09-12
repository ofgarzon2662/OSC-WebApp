import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ArtifactHistoryItem } from '../../models/artifact-history.model';
import { ArtifactService } from '../services/artifact.service';
import { HistoryCacheService } from '../services/history-cache.service';

@Component({
  selector: 'app-history-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history-detail.component.html',
  styleUrls: ['./history-detail.component.css']
})
export class HistoryDetailComponent implements OnInit {
  artifactId = '';
  txId = '';
  isLoading = true;
  item?: ArtifactHistoryItem;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly artifactService: ArtifactService,
    private readonly cache: HistoryCacheService
  ) {}

  ngOnInit(): void {
    this.artifactId = this.route.snapshot.paramMap.get('id') ?? '';
    this.txId = this.route.snapshot.paramMap.get('txId') ?? '';

    // Try router state first
    const nav = history.state as { snapshot?: ArtifactHistoryItem };
    if (nav?.snapshot) {
      this.item = nav.snapshot;
      if (this.item?.txId) this.cache.set(this.item.txId, this.item);
      this.isLoading = false;
      return;
    }

    // Try cache
    const cached = this.cache.get(this.txId);
    if (cached) {
      this.item = cached;
      this.isLoading = false;
      return;
    }

    // Fallback: fetch pages until found or small cap
    this.fetchUntilFound().then(found => {
      if (!found) this.errorMessage = 'Snapshot not found.';
      this.isLoading = false;
    }).catch(() => {
      this.errorMessage = 'Unable to load snapshot.';
      this.isLoading = false;
    });
  }

  private async fetchUntilFound(): Promise<boolean> {
    const limit = 25;
    let offset = 0;
    let total = 0;
    let scanned = 0;
    const maxScan = 1000; // safety cap
    do {
      const res = await this.artifactService.getArtifactHistory(this.artifactId, { offset, limit, order: 'desc', includeValue: true }).toPromise();
      const items = res?.items ?? [];
      total = res?.total ?? total;
      for (const it of items) {
        if (it?.txId) this.cache.set(it.txId, it);
        if (it.txId === this.txId) {
          this.item = it;
          return true;
        }
      }
      offset += limit;
      scanned += items.length;
    } while (scanned < total && scanned < maxScan);
    return false;
  }
}


