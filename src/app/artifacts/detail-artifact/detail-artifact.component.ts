import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
    private readonly artifactService: ArtifactService,
    private readonly router: Router
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
    if (!this.artifact?.manifest?.length) return;

    const manifestText = this.artifact.manifest
      .map(item => `${item.filename}\t${item.hash}\t${item.algorithm}`)
      .join('\n');

    const win = window.open('', '_blank');      // keep it simple, no “noopener,noreferrer”
    if (!win) {
      alert('Please allow pop-ups to print the manifest.');
      return;
    }

    // Assemble the page in one go
    const html = `
    <!doctype html>
    <html>
      <head>
        <title>Artifact Manifest</title>
        <style>
          body { font-family: monospace; white-space: pre; margin: 16px; }
        </style>
      </head>
      <body>${manifestText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</body>
    </html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();           // ensures the body is fully built

    // give the browser one paint cycle, then print
    setTimeout(() => {
      win.focus();
    }, 10);
  }

  onUpdateArtifact(): void {
    if (!this.artifact) return;
    this.router.navigate(['/update-artifact', this.artifact.id]);
  }

  truncated(value: string | null, len = 12): string {
    if (!value) return '—';
    return value.length > len ? value.slice(0, len) + '…' : value;
  }
} 