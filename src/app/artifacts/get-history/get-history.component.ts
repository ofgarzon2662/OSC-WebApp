import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ArtifactService } from '../services/artifact.service';
import { ArtifactHistoryItem } from '../../models/artifact-history.model';
import { ArtifactDetail } from '../../models/artifact-detail.model';

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
  items: ArtifactHistoryItem[] = [];
  errorMessage = '';
  artifactTitle = '';
  artifactDescription = '';

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

    // Fetch title (detail) for header display
    this.artifactService.getArtifactById(this.artifactId).subscribe({
      next: (detail: ArtifactDetail) => {
        this.artifactTitle = detail?.title ?? '';
        this.artifactDescription = detail?.description ?? '';
      },
      error: () => {}
    });

    this.artifactService.getArtifactHistory(this.artifactId, { offset: 0, limit: 100, order: 'desc', includeValue: true })
      .subscribe({
        next: res => {
          const received = res.items ?? [];
          this.items = received.sort((a, b) => {
            const at = new Date(a.timestamp).getTime();
            const bt = new Date(b.timestamp).getTime();
            return bt - at; // Newest first
          });
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load artifact history.';
          this.isLoading = false;
        }
      });
  }
}


