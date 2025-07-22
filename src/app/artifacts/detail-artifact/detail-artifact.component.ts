import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ArtifactService } from '../services/artifact.service';
import { ArtifactDetail } from '../../models/artifact-detail.model';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-detail-artifact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-artifact.component.html',
  styleUrls: ['./detail-artifact.component.css']
})
export class DetailArtifactComponent implements OnInit {
  artifact?: ArtifactDetail;
  isLoading = true;
  showBlockchain = false;
  showPeer = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly artifactService: ArtifactService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = params.get('id');
          return id ? this.artifactService.getArtifactById(id) : of(null);
        })
      )
      .subscribe(detail => {
        this.artifact = detail || undefined;
        this.isLoading = false;
      });
  }

  printManifest(): void {
    if (!this.artifact?.manifest) return;

    const manifestText = this.artifact.manifest
      .map(item => `${item.filename}\t${item.hash}\t${item.algorithm}`)
      .join('\n');

    const newWin = window.open('', '_blank', 'noopener,noreferrer');
    if (newWin) {
      const doc = newWin.document;
      doc.title = 'Artifact Manifest';
      const pre = doc.createElement('pre');
      pre.textContent = manifestText;
      doc.body.appendChild(pre);
      newWin.print();
    }
  }

  truncated(value: string | null, len = 12): string {
    if (!value) return '—';
    return value.length > len ? value.slice(0, len) + '…' : value;
  }
} 